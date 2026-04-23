import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Attendance, User } from '@/lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function GET(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const personalOnly = searchParams.get('personal') === 'true';

    let query: any = { user_id: userPayload.id };
    
    // If Admin and NOT requesting personal history, fetch all attendance records for their company
    if (userPayload.role === 'Admin' && !personalOnly) {
      const companyUserIds = await User.find({ company_id: userPayload.companyId }).distinct('_id');
      query = { user_id: { $in: companyUserIds } };
    }

    const history = await Attendance.find(query)
      .populate('user_id', 'name') // Populate user name
      .sort({ clock_in_time: -1 })
      .limit(50);
      
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
