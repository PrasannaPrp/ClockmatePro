import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Payroll } from '@/lib/models';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function GET(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();

    // Get last 6 months of payroll data for trends
    const sixMonthsAgo = subMonths(new Date(), 6);
    
    const payrolls = await Payroll.find({
      company_id: userPayload.companyId,
      created_at: { $gte: sixMonthsAgo }
    }).sort({ created_at: 1 });

    // Format for the chart
    const chartData = payrolls.map(p => ({
      month: new Date(p.period_start).toLocaleDateString('en-US', { month: 'short' }),
      amount: p.total_gross_pay,
      employees: p.employee_records.length
    }));

    // Aggregate stats
    const totalSpent = payrolls.reduce((acc, p) => acc + p.total_gross_pay, 0);
    const avgMonthly = chartData.length > 0 ? totalSpent / chartData.length : 0;

    return NextResponse.json({
      success: true,
      chartData,
      summary: {
        totalSpent,
        avgMonthly,
        runCount: payrolls.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
