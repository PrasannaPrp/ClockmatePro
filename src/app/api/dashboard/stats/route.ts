import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { User, Attendance } from '@/lib/models';
import { startOfDay, endOfDay } from 'date-fns';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const companyId = userPayload.companyId;
    
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const totalEmployees = await User.countDocuments({ company_id: companyId });
    
    // Using aggregation for active today count
    const activeToday = await Attendance.distinct('user_id', {
      clock_in_time: { $gte: todayStart, $lte: todayEnd }
    });

    const pendingApprovals = await Attendance.countDocuments({
      status: 'Pending',
      user_id: { $in: await User.find({ company_id: companyId }).distinct('_id') }
    });

    return NextResponse.json({
      totalEmployees,
      activeToday: activeToday.length,
      pendingApprovals
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
