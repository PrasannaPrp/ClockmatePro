import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { User, Attendance, Payroll } from '@/lib/models';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();

    // 1. Fetch user details
    const employee = await User.findById(id).select('-password_hash');
    if (!employee || employee.company_id.toString() !== userPayload.companyId) {
      return NextResponse.json({ error: 'Employee not found or access denied' }, { status: 404 });
    }

    // 2. Fetch attendance history
    const attendance = await Attendance.find({ user_id: id })
      .sort({ clock_in_time: -1 })
      .limit(30);

    // 3. Fetch payroll history (specific to this user within the company's payroll runs)
    // In our Payroll model, we have employee_records as an array. 
    // We need to find payroll runs for this company and filter for this specific user.
    const payrollRuns = await Payroll.find({ 
      company_id: userPayload.companyId,
      "employee_records.user_id": new mongoose.Types.ObjectId(id)
    }).sort({ created_at: -1 });

    // Map the payroll runs to just this user's specific performance data
    const payrollHistory = payrollRuns.map(run => {
      const userRecord = run.employee_records.find((rec: any) => rec.user_id.toString() === id);
      return {
        _id: run._id,
        period_start: run.period_start,
        period_end: run.period_end,
        created_at: run.created_at,
        ...userRecord
      };
    });

    return NextResponse.json({
      success: true,
      employee,
      attendance,
      payrollHistory
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const body = await req.json();
    
    // Safety check: Ensure the employee belongs to the same company
    const employee = await User.findById(id);
    if (!employee || employee.company_id.toString() !== userPayload.companyId) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 403 });
    }

    // Update fields (excluding sensitive ones)
    const allowedUpdates = ['name', 'email', 'role', 'hourly_rate', 'status'];
    const updates: any = {};
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    const updatedEmployee = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password_hash');

    return NextResponse.json({
      success: true,
      employee: updatedEmployee
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
