import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/mongodb';
import { Company, User } from '@/lib/models';
import { sendCompanyWelcomeEmail } from '@/lib/mailer';

const JWT_SECRET = process.env.JWT_SECRET || 'clockmate-secret-key';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, password, address } = await req.json();

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create Company
    const company = await Company.create({
      name,
      email,
      password_hash: hashedPassword,
      address
    });
    
    // Create Admin User
    await User.create({
      name: name + " Admin",
      email,
      password_hash: hashedPassword,
      role: 'Admin',
      company_id: company._id
    });

    // Send Real welcome email via Google SMTP
    try {
      await sendCompanyWelcomeEmail(email, name);
    } catch (err) {
      console.error('Email failed via Google SMTP:', err);
    }

    return NextResponse.json({ success: true, message: "Company registered successfully" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
