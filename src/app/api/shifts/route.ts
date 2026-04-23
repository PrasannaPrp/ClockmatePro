import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Shift, User } from '@/lib/models';
import { sendSimulatedEmail } from '@/lib/notifications';
import { format } from 'date-fns';

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
    
    let query: any = { company_id: userPayload.companyId };
    
    // If Staff, only show their own shifts
    if (userPayload.role === 'Staff') {
      query.user_id = userPayload.id;
    }

    const shifts = await Shift.find(query)
      .populate('user_id', 'name')
      .sort({ start_time: 1 });

    return NextResponse.json({ success: true, shifts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const { user_id, start_time, end_time, title, notes } = await req.json();

    const newShift = await Shift.create({
      user_id,
      company_id: userPayload.companyId,
      start_time: new Date(start_time),
      end_time: new Date(end_time),
      title,
      notes
    });

    // Notify employee
    const employee = await User.findById(user_id);
    if (employee) {
      await sendSimulatedEmail({
        to: employee.email,
        subject: `New Shift Scheduled: ${format(new Date(start_time), 'PPP')}`,
        type: 'shift',
        body: `Hello ${employee.name},\n\nA new shift has been assigned to you.\n\nDate: ${format(new Date(start_time), 'PP')}\nTime: ${format(new Date(start_time), 'p')} - ${format(new Date(end_time), 'p')}\nTitle: ${title}\nNotes: ${notes || 'N/A'}\n\nPlease check your schedule in ClockMate for details.`
      });
    }

    return NextResponse.json({ success: true, shift: newShift });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
