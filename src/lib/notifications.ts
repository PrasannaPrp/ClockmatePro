/**
 * Simulated Email Notification Service for ClockMate.
 * In a production environment, this would integrate with Resend, SendGrid, or AWS SES.
 */

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  type: 'payslip' | 'shift' | 'invite';
}

export async function sendSimulatedEmail(payload: EmailPayload) {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  console.log('--- SENT SIMULATED EMAIL ---');
  console.log(`TYPE:    ${payload.type.toUpperCase()}`);
  console.log(`TO:      ${payload.to}`);
  console.log(`SUBJECT: ${payload.subject}`);
  console.log(`CONTENT SUMMARY: ${payload.body.substring(0, 100)}...`);
  console.log('-----------------------------');
  
  return { success: true, messageId: Math.random().toString(36).substring(7) };
}
