import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/lib/models';
import { sendResetPinEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      // For security, don't reveal if user exists, but we'll return success to avoid enumeration
      return NextResponse.json({ success: true, message: "If an account exists, a PIN has been sent." });
    }

    // Generate 8-digit PIN
    const pin = Math.floor(10000000 + Math.random() * 90000000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.reset_pin = pin;
    user.reset_expires = expires;
    await user.save();

    await sendResetPinEmail(email, pin);

    return NextResponse.json({ success: true, message: "PIN sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
