/**
 * Phase 13 notification providers (OTP delivery).
 *
 * HONEST DESIGN: a real SMS/email is claimed ONLY when a provider was
 * actually configured and the provider call succeeded. Otherwise the
 * result is { delivered: 'demo', demo: true } and the UI shows a demo
 * banner — never a fake "SMS পাঠানো হয়েছে" message.
 *
 * Env vars:
 *  - SMS_API_URL + SMS_API_KEY (+ optional SMS_API_SENDER): generic HTTP
 *    SMS API. POST JSON { to, message, sender? } with header
 *    "Authorization: Bearer <SMS_API_KEY>". Works with SSL Wireless,
 *    D7, Twilio-style HTTP gateways (see README-SETUP-BN.md ধাপ ১.১৩ —
 *    the user must adapt per gateway docs and paste credentials in Vercel).
 *  - SMTP_HOST + SMTP_PORT + SMTP_USER + SMTP_PASS (+ SMTP_FROM):
 *    standard SMTP for email OTP (e.g. Gmail App Password, or any provider).
 */

export type SendResult =
  | { delivered: 'sms' | 'email'; demo: false }
  | { delivered: 'demo'; demo: true; reason?: string };

const OTP_SMS_BN = (code: string) =>
  `জনতার কথা: আপনার যাচাইকরণ কোড ${code}। এটি ৫ মিনিটের জন্য বৈধ। কারো সাথে শেয়ার করবেন না।`;

export function isSmsConfigured(): boolean {
  return Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY);
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendSms(phone: string, code: string): Promise<SendResult> {
  const url = process.env.SMS_API_URL;
  const key = process.env.SMS_API_KEY;
  if (!url || !key) {
    console.log(`[DEMO SMS → ${phone}] OTP কোড: ${code}`);
    return { delivered: 'demo', demo: true, reason: 'no-sms-provider' };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        to: phone,
        message: OTP_SMS_BN(code),
        sender: process.env.SMS_API_SENDER || undefined,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`SMS API HTTP ${res.status}`);
    return { delivered: 'sms', demo: false };
  } catch (e) {
    // Provider configured but failed: log it, and fall back to demo-mode
    // honesty — the caller surfaces this as a warning, never as success.
    console.error('[notify] SMS provider failed, falling back to demo display:', e);
    console.log(`[DEMO SMS → ${phone}] OTP কোড: ${code}`);
    return { delivered: 'demo', demo: true, reason: 'sms-provider-failed' };
  }
}

export async function sendEmail(email: string, code: string): Promise<SendResult> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    console.log(`[DEMO EMAIL → ${email}] OTP কোড: ${code}`);
    return { delivered: 'demo', demo: true, reason: 'no-smtp-config' };
  }
  try {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: email,
      subject: 'জনতার কথা — যাচাইকরণ কোড',
      text: `আপনার যাচাইকরণ কোড: ${code}\n\nএটি ৫ মিনিটের জন্য বৈধ। কারো সাথে শেয়ার করবেন না।`,
    });
    return { delivered: 'email', demo: false };
  } catch (e) {
    console.error('[notify] SMTP failed, falling back to demo display:', e);
    console.log(`[DEMO EMAIL → ${email}] OTP কোড: ${code}`);
    return { delivered: 'demo', demo: true, reason: 'smtp-failed' };
  }
}
