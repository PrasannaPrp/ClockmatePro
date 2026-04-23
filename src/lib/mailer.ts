import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.GOOGLE_EMAIL,
    pass: process.env.GOOGLE_PASSWORD, // Google App Password
  },
});

interface WelcomeEmailOptions {
  toEmail: string;
  toName: string;
  password: string;
  companyName?: string;
}

export async function sendWelcomeEmail({ toEmail, toName, password, companyName }: WelcomeEmailOptions) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  await transporter.sendMail({
    from: `"ClockMate Notifications" <${process.env.GOOGLE_EMAIL}>`,
    to: toEmail,
    subject: `Welcome to ClockMate${companyName ? ` – ${companyName}` : ''}! Your login details`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; color: #1e293b;">
        <h2 style="margin-bottom: 8px;">Welcome to the team, ${toName}! 🚀</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 24px;">Your access for <strong>${companyName || 'ClockMate'}</strong> is now active. Use the secure credentials below to access your dashboard.</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0; font-size: 14px;"><strong>Email:</strong> ${toEmail}</p>
          <p style="margin: 4px 0 0; font-size: 14px;"><strong>Password:</strong> <code>${password}</code></p>
        </div>
        <a href="${appUrl}" style="display:inline-block; background:#4f46e5; color:#fff; text-decoration:none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px;">
          Log In to ClockMate →
        </a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
          Please change your password after your first login. If you have any issues, contact your administrator.
        </p>
      </div>
    `,
  });
}

export async function sendCompanyWelcomeEmail(email: string, companyName: string) {
  await transporter.sendMail({
    from: `"ClockMate" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: `Welcome to ClockMate, ${companyName}! 🥂`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; color: #1e293b; border: 1px solid #f1f5f9; border-radius: 16px;">
        <h1 style="font-size: 24px;">Welcome aboard, ${companyName}!</h1>
        <p style="line-height: 1.6; color: #475569;">Your organization is now live on ClockMate. Start adding your workforce and automating your payroll sequences today.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;"/>
        <p style="font-size: 12px; color: #94a3b8;">ClockMate Workforce Management Systems</p>
      </div>
    `,
  });
}

export async function sendResetPinEmail(email: string, pin: string) {
  await transporter.sendMail({
    from: `"ClockMate Security" <${process.env.GOOGLE_EMAIL}>`,
    to: email,
    subject: 'Your Password Reset PIN - ClockMate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; color: #1e293b; border: 1px solid #f1f5f9; border-radius: 16px;">
        <h2 style="font-size: 20px; margin-bottom: 16px;">Security Verification 🛡️</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">You have requested to reset your password. Use the following 8-digit PIN to proceed. This code will expire in 15 minutes.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 0.3em; color: #4f46e5;">${pin}</span>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8;">If you did not request this, please ignore this email or contact your administrator if you believe your account is at risk.</p>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 24px 0;"/>
        <p style="font-size: 11px; color: #cbd5e1; text-align: center;">ClockMate Security Protocol</p>
      </div>
    `,
  });
}
