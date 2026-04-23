import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { User, Attendance, Payroll, Company } from '@/lib/models';
import { startOfWeek, addDays, differenceInMinutes, format, isWithinInterval, parseISO } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

// ─── Australian Public Holidays (AEST) ───────────────────────────────────────
// Add your state's public holidays here (YYYY-MM-DD)
const PUBLIC_HOLIDAYS = new Set([
  '2025-01-01', // New Year's Day
  '2025-01-27', // Australia Day (observed)
  '2025-04-18', // Good Friday
  '2025-04-19', // Easter Saturday
  '2025-04-20', // Easter Sunday
  '2025-04-21', // Easter Monday
  '2025-04-25', // ANZAC Day
  '2025-06-09', // King's Birthday (QLD)
  '2025-08-13', // Royal Queensland Show
  '2025-10-06', // Labour Day (QLD)
  '2025-12-25', // Christmas Day
  '2025-12-26', // Boxing Day
  '2026-01-01', // New Year's Day
  '2026-01-26', // Australia Day
  '2026-04-03', // Good Friday
  '2026-04-06', // Easter Monday
  '2026-04-25', // ANZAC Day
  '2026-06-08', // King's Birthday (QLD)
  '2026-08-12', // Royal Queensland Show
  '2026-10-05', // Labour Day (QLD)
  '2026-12-25', // Christmas Day
  '2026-12-26', // Boxing Day (observed 28th)
]);

function isPublicHoliday(date: Date): boolean {
  return PUBLIC_HOLIDAYS.has(format(date, 'yyyy-MM-dd'));
}

/**
 * Returns the start of the current fortnightly pay period.
 * Fortnightly: Monday–Sunday (2 weeks). Anchored to a known
 * Monday (2025-01-06) so cycles are consistent.
 */
function getFortnightPeriod(referenceDate: Date): { start: Date; end: Date } {
  const anchor = new Date('2025-01-06T00:00:00'); // A known Monday
  const msPerFortnight = 14 * 24 * 60 * 60 * 1000;
  const diff = referenceDate.getTime() - anchor.getTime();
  const periodsElapsed = Math.floor(diff / msPerFortnight);
  const start = new Date(anchor.getTime() + periodsElapsed * msPerFortnight);
  const end = new Date(start.getTime() + msPerFortnight - 1); // Last ms of Sunday
  return { start, end };
}

/**
 * For a clock_in → clock_out window, calculates minutes falling into each category.
 * Splits the shift minute-by-minute across day boundaries aware of public holidays.
 */
/**
 * Categorises every second of a shift into pay buckets (Regular, Evening, Night, Public Holiday).
 * This provides 100% precision for "pay per second" especially for short shifts.
 */
function categoriseShiftSeconds(clockIn: Date, clockOut: Date) {
  let regularSec = 0;
  let eveningSec = 0; // 18:00–23:59 on a normal day (+15% loading)
  let nightSec = 0;   // 00:00–05:59 on any day (+30% loading)
  let publicHolidaySec = 0; // entire shift on PH day (250%)

  const totalSec = Math.floor((clockOut.getTime() - clockIn.getTime()) / 1000);

  for (let i = 0; i < totalSec; i++) {
    const current = new Date(clockIn.getTime() + i * 1000);
    const hour = current.getHours();
    const dayStr = format(current, 'yyyy-MM-dd');

    if (PUBLIC_HOLIDAYS.has(dayStr)) {
      publicHolidaySec++;
    } else if (hour >= 0 && hour < 6) {
      nightSec++;
    } else if (hour >= 18) {
      eveningSec++;
    } else {
      regularSec++;
    }
  }

  return { regularSec, eveningSec, nightSec, publicHolidaySec, totalSec };
}

/**
 * Applies overtime logic: first 8h of a shift are ordinary, remaining are OT.
 * Threshold is now 28,800 seconds (8 hours).
 */
function applyOvertimeToSegments(secs: ReturnType<typeof categoriseShiftSeconds>) {
  const OT_THRESHOLD = 8 * 60 * 60; // 28,800 seconds

  let { regularSec, eveningSec, nightSec, publicHolidaySec } = secs;
  let otSec = 0;

  // Only regular + evening time counts toward the 8h ordinary threshold
  const ordinarySec = regularSec + eveningSec;
  if (ordinarySec > OT_THRESHOLD) {
    const excess = ordinarySec - OT_THRESHOLD;
    otSec = excess;
    // Trim from evening first, then regular
    if (eveningSec >= excess) {
      eveningSec -= excess;
    } else {
      const remaining = excess - eveningSec;
      eveningSec = 0;
      regularSec -= remaining;
    }
  }

  return { regularSec, eveningSec, nightSec, publicHolidaySec, otSec };
}


// ─── POST: Run Payroll ────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'Admin')
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

    await dbConnect();

    // Use provided dates or auto-detect current fortnight
    const body = await req.json().catch(() => ({}));
    let periodStart: Date, periodEnd: Date;

    if (body.startDate && body.endDate) {
      periodStart = new Date(body.startDate);
      periodEnd = new Date(body.endDate);
    } else {
      const fortnight = getFortnightPeriod(new Date());
      periodStart = fortnight.start;
      periodEnd = fortnight.end;
    }

    const fortnightsAdmin = await User.findById(decoded.id);
    const employees = await User.find({ company_id: decoded.companyId, status: 'Active' });
    const company = await Company.findById(decoded.companyId);
    
    // Fallback multipliers linked to Company Settings
    const otMult   = company?.ot_rate || 1.5;
    const eveLoad  = company?.evening_loading || 0.15;
    const nightLoad = company?.night_loading || 0.30;
    const phMult   = company?.holiday_rate || 2.5;

    const records = [];
    let totalGrossPay = 0;

    for (const emp of employees) {
      const attendances = await Attendance.find({
        user_id: emp._id,
        clock_in_time: { $gte: periodStart, $lte: periodEnd },
        clock_out_time: { $exists: true, $ne: null },
        approval_status: 'Approved'  // ✅ Only approved shifts count toward payroll
      });

      let totalRegSec = 0, totalOTSec = 0, totalEveSec = 0, totalNightSec = 0, totalPHSec = 0;
      const dailyShifts = [];

      for (const a of attendances) {
        const raw = categoriseShiftSeconds(new Date(a.clock_in_time), new Date(a.clock_out_time!));
        const broken = applyOvertimeToSegments(raw);
        totalRegSec   += broken.regularSec;
        totalOTSec    += broken.otSec;
        totalEveSec   += broken.eveningSec;
        totalNightSec += broken.nightSec;
        totalPHSec    += broken.publicHolidaySec;

        dailyShifts.push({
          date: a.clock_in_time,
          clock_in: a.clock_in_time,
          clock_out: a.clock_out_time,
          hours: (raw.totalSec / 3600),
          reg_hrs: broken.regularSec / 3600,
          ot_hrs: broken.otSec / 3600,
          eve_hrs: broken.eveningSec / 3600,
          night_hrs: broken.nightSec / 3600,
          ph_hrs: broken.publicHolidaySec / 3600
        });
      }

      // Convert seconds to decimal hours for financial calculation (3600 seconds in 1 hour)
      const regHrs   = totalRegSec   / 3600;
      const otHrs    = totalOTSec    / 3600;
      const eveHrs   = totalEveSec   / 3600;
      const nightHrs = totalNightSec / 3600;
      const phHrs    = totalPHSec    / 3600;

      const rate = emp.hourly_rate || 25;

      // Pay components using dynamic company rates
      const basePay        = Number((regHrs * rate).toFixed(2));
      const otPay          = Number((otHrs  * rate * otMult).toFixed(2));
      const eveningLoading = Number((eveHrs * rate * eveLoad).toFixed(2));
      const eveningBase    = Number((eveHrs * rate).toFixed(2));
      const nightLoading   = Number((nightHrs * rate * nightLoad).toFixed(2));
      const nightBase      = Number((nightHrs * rate).toFixed(2));
      const phPay          = Number((phHrs * rate * phMult).toFixed(2));

      const grossPay = Number((basePay + otPay + eveningBase + eveningLoading + nightBase + nightLoading + phPay).toFixed(2));
      const tax      = Number((grossPay * 0.20).toFixed(2));
      const netPay   = Number((grossPay - tax).toFixed(2));

      records.push({
        user_id: emp._id,
        user_name: emp.name,
        total_hours: (totalRegSec + totalOTSec + totalEveSec + totalNightSec + totalPHSec) / 3600,
        reg_hours: regHrs,
        ot_hours: otHrs,
        evening_hours: eveHrs,
        night_hours: nightHrs,
        public_holiday_hours: phHrs,
        hourly_rate: rate,
        base_pay: basePay,
        ot_pay: otPay,
        evening_loading: eveningLoading,
        night_loading: nightLoading,
        public_holiday_pay: phPay,
        gross_pay: grossPay,
        tax,
        net_pay: netPay,
        daily_shifts: dailyShifts
      });

      totalGrossPay += grossPay;
    }

    const payrollRun = await Payroll.create({
      company_id: decoded.companyId,
      period_start: periodStart,
      period_end: periodEnd,
      total_gross_pay: Number(totalGrossPay.toFixed(2)),
      employee_records: records,
      approved_by_name: fortnightsAdmin?.name || 'COMPANY ADMIN'
    });

    return NextResponse.json({ success: true, data: payrollRun });

  } catch (error: any) {
    console.error('Payroll Calculation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// ─── GET: Payroll History ─────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer '))
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.split(' ')[1];
    const decoded: any = jwt.verify(token, JWT_SECRET);
    await dbConnect();

    const allPayroll = await Payroll.find({ company_id: decoded.companyId }).sort({ created_at: -1 });

    if (decoded.role === 'Admin') {
      // Admins see the full breakdown for all employees
      return NextResponse.json({ success: true, history: allPayroll });
    } else {
      // Staff only see their own record within each payroll cycle
      const staffHistory = allPayroll
        .map(cycle => {
          const myRecord = cycle.employee_records.find(
            (r: any) => r.user_id?.toString() === decoded.id
          );
          if (!myRecord) return null; // This cycle didn't include this employee
          return {
            _id: cycle._id,
            period_start: cycle.period_start,
            period_end: cycle.period_end,
            created_at: cycle.created_at,
            approved_by_name: cycle.approved_by_name,
            employee_records: [myRecord] // Only their own record
          };
        })
        .filter(Boolean); // Remove cycles where this employee had no record

      return NextResponse.json({ success: true, history: staffHistory });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

