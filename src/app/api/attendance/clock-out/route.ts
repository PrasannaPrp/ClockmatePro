import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Attendance, Shift } from '@/lib/models';
import { startOfDay, endOfDay } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function POST(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { lat, lng } = await req.json().catch(() => ({}));

    // Find the active session (more robust check)
    const existing = await Attendance.findOne({
      user_id: userPayload.id,
      $or: [
        { clock_out_time: { $exists: false } },
        { clock_out_time: null }
      ]
    }).sort({ clock_in_time: -1 });

    if (!existing) {
      return NextResponse.json({
        error: 'No active session found.',
        alreadyDone: true
      }, { status: 400 });
    }

    const clockOutTime = new Date();
    existing.clock_out_time = clockOutTime;
    await existing.save();

    // 🔄 SYNC: Mark the corresponding scheduled shift as 'Completed'
    // Look for a shift for this user that starts today
    try {
      const todayStart = startOfDay(existing.clock_in_time);
      const todayEnd = endOfDay(existing.clock_in_time);
      
      await Shift.findOneAndUpdate(
         { 
           user_id: userPayload.id, 
           start_time: { $gte: todayStart, $lte: todayEnd },
           status: 'Scheduled'
         },
         { status: 'Logged' }
      );
    } catch (syncErr) {
      console.warn('⚠️ Shift status sync failed (non-critical):', syncErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
