import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, pin, newPassword } = await req.json();

    const user = await User.findOne({
      email,
      reset_pin: pin,
      reset_expires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid or expired PIN" }, { status: 400 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password_hash = hashedPassword;
    
    // Clear reset tokens
    user.reset_pin = null;
    user.reset_expires = null;
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
