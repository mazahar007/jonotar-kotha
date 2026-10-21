import { NextRequest, NextResponse } from 'next/server';
import { err, ok } from '@/lib/api';
import { issueOtp, normalizeDestination, validPhone } from '@/lib/otp';
import { sendSms } from '@/lib/notify';
import { getSessionMemberRow } from '@/lib/member-session';
import { getMemberRowByPhone } from '@/lib/members-store';

/**
 * Phase 13 — add a phone to a logged-in account (email-only → verified).
 * POST /api/member-auth/add-phone { phone }
 * Issues a 'verify_phone' OTP; the client verifies it via /verify-otp
 * with purpose='verify_phone' (session required there too).
 */
export async function POST(req: NextRequest) {
  const sessionRow = await getSessionMemberRow();
  if (!sessionRow) return err('লগইন করা নেই', 401);

  const body = await req.json().catch(() => ({}));
  const phone = normalizeDestination(body.phone);
  if (!phone) return err('মোবাইল নম্বর দিন');
  if (!validPhone(phone)) return err('সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)');

  const other = await getMemberRowByPhone(phone);
  if (other && other.id !== sessionRow.id) {
    return err('এই নম্বর অন্য একটি অ্যাকাউন্টে ব্যবহার করা হয়েছে', 409);
  }

  const issued = await issueOtp(phone, 'verify_phone');
  if (!issued.ok) {
    return NextResponse.json(
      { error: issued.error, retry_after_ms: issued.retry_after_ms },
      { status: issued.retry_after_ms ? 429 : 400 }
    );
  }

  const sent = await sendSms(phone, issued.code);

  return ok({
    ok: true,
    destination: phone,
    channel: 'sms',
    purpose: 'verify_phone',
    demo: sent.demo,
    demo_code: sent.demo ? issued.code : undefined,
    demo_reason: sent.demo ? sent.reason : undefined,
    expires_in_ms: 5 * 60 * 1000,
  });
}
