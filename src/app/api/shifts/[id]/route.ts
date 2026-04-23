import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Shift } from '@/lib/models';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

async function authenticate(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET) as any; } catch { return null; }
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
    
    const shift = await Shift.findOneAndUpdate(
      { _id: id, company_id: userPayload.companyId },
      { $set: body },
      { new: true }
    );

    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });

    return NextResponse.json({ success: true, shift });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(
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
    const shift = await Shift.findOneAndDelete({ _id: id, company_id: userPayload.companyId });

    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
