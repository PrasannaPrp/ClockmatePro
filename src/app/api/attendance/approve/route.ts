import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Attendance, User, Shift } from '@/lib/models';
import { startOfDay, endOfDay } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

/**
 * GET /api/attendance/approve
 * Returns all completed (clocked-out) attendance records for the company,
 * grouped by status: Pending, Approved, Rejected.
 * Admin only.
 */
export async function GET(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    await dbConnect();

    const companyUserIds = await User.find({ company_id: userPayload.companyId }).distinct('_id');

    // 🛠️ AUTO-MIGRATION: Fix any old records missing or having null approval_status
    await Attendance.updateMany(
      { 
        user_id: { $in: companyUserIds }, 
        $or: [
          { approval_status: { $exists: false } },
          { approval_status: null }
        ]
      },
      { $set: { approval_status: 'Pending' } }
    );

    const records = await Attendance.find({
      user_id: { $in: companyUserIds },
      clock_out_time: { $exists: true, $ne: null }
    })
      .populate('user_id', 'name email role hourly_rate')
      .sort({ clock_in_time: -1 })
      .limit(200);

    return NextResponse.json({ success: true, records });
  } catch (error: any) {
    console.error('🔥 Approval GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/attendance/approve
 * Approve or reject a single attendance record.
 * Admin only. Records who approved it and when.
 * Body: { attendanceId: string, action: 'Approved' | 'Rejected' }
 */
export async function PATCH(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin')
    return NextResponse.json({ error: 'Forbidden — Admin access only' }, { status: 403 });

  try {
    await dbConnect();

    const { attendanceId, action, clockInTime, clockOutTime } = await req.json();
    console.log('📝 Approval/Edit Request:', { attendanceId, action, adminUser: userPayload.name });

    if (!attendanceId) {
      return NextResponse.json({ error: 'Missing attendanceId' }, { status: 400 });
    }

    const companyUserIds = await User.find({ company_id: userPayload.companyId }).distinct('_id');

    // Build the update object
    const updateData: any = {};
    if (action) {
      if (!['Approved', 'Rejected', 'Pending'].includes(action))
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
      updateData.approval_status = action;
      updateData.approved_by = userPayload.id;
      updateData.approved_by_name = userPayload.name;
      updateData.approved_at = new Date();
    }

    if (clockInTime) updateData.clock_in_time = new Date(clockInTime);
    if (clockOutTime) updateData.clock_out_time = new Date(clockOutTime);

    // Verify and update
    const record = await Attendance.findOneAndUpdate(
      { _id: attendanceId },
      updateData,
      { new: true }
    );

    if (!record) {
      console.error('❌ Record not found during approval/edit:', attendanceId);
      return NextResponse.json({ error: 'Attendance record not found.' }, { status: 404 });
    }

    // 🔄 SYNC: If approved, mark the scheduled shift as 'Completed'
    if (action === 'Approved' && record.clock_in_time) {
      try {
        const todayStart = startOfDay(new Date(record.clock_in_time));
        const todayEnd = endOfDay(new Date(record.clock_in_time));
        
        await Shift.findOneAndUpdate(
          { 
            user_id: record.user_id, 
            start_time: { $gte: todayStart, $lte: todayEnd },
            status: 'Logged'
          },
          { status: 'Completed' }
        );
      } catch (syncErr) {
        console.warn('⚠️ Shift approval sync failed:', syncErr);
      }
    }

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error('🔥 Approval/Edit API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
