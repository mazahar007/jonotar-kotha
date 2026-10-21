import { NextRequest, NextResponse } from 'next/server';
import { err, ok } from '@/lib/api';
import { issueOtp, normalizeDestination, validEmail, validPhone } from '@/lib/otp';
import { sendEmail, sendSms } from '@/lib/notify';
import { getMemberRowByEmail, getMemberRowByPhone } from '@/lib/members-store';

/**
 * Phase 13 — OTP login (password-free).
 * POST /api/member-auth/login { destination } (phone or email)
 * Sends a login OTP; the client verifies it via /verify-otp purpose='login'.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const raw = body.destination ?? body.phone ?? body.email;
  const destination = normalizeDestination(raw);
  if (!destination) return err('মোবাইল নম্বর অথবা ইমেইল দিন');

  const isEmail = destination.includes('@');
  if (isEmail ? !validEmail(destination) : !validPhone(destination)) {
    return err(isEmail ? 'সঠিক ইমেইল ঠিকানা দিন' : 'সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)');
  }

  const row = isEmail ? await getMemberRowByEmail(destination) : await getMemberRowByPhone(destination);
  if (!row) return err('এই ঠিকানায় কোনো নিবন্ধন পাওয়া যায়নি — আগে নিবন্ধন করুন', 404);

  const issued = await issueOtp(destination, 'login');
  if (!issued.ok) {
    return NextResponse.json(
      { error: issued.error, retry_after_ms: issued.retry_after_ms },
      { status: issued.retry_after_ms ? 429 : 400 }
    );
  }

  const sent = isEmail ? await sendEmail(destination, issued.code) : await sendSms(destination, issued.code);

  return ok({
    ok: true,
    destination,
    channel: isEmail ? 'email' : 'sms',
    purpose: 'login',
    demo: sent.demo,
    demo_code: sent.demo ? issued.code : undefined,
    demo_reason: sent.demo ? sent.reason : undefined,
    expires_in_ms: 5 * 60 * 1000,
  });
}
