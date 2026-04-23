import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '@/lib/mailer';

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
    const employees = await User.find({ company_id: userPayload.companyId }, 'id name email role hourly_rate status');
    return NextResponse.json(employees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const userPayload = await authenticate(req);
  if (!userPayload || userPayload.role !== 'Admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const { name, email, password, role, hourly_rate } = await req.json();
    const plainPassword = password || 'Password123!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    await User.create({
      name,
      email,
      password_hash: hashedPassword,
      role,
      hourly_rate,
      company_id: userPayload.companyId
    });

    // Send welcome email with login credentials
    try {
      await sendWelcomeEmail({
        toEmail: email,
        toName: name,
        password: plainPassword,
        companyName: userPayload.companyName,
      });
    } catch (emailError) {
      console.error('Welcome email failed to send:', emailError);
      // Don't block the response — employee was still created successfully
    }
    
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
