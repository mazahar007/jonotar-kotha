import { NextRequest, NextResponse } from 'next/server';
import { err, ok } from '@/lib/api';
import { issueOtp, normalizeDestination, validEmail, validPhone } from '@/lib/otp';
import { sendEmail, sendSms } from '@/lib/notify';
import { createAuthMemberRow, getMemberRowByEmail, getMemberRowByPhone } from '@/lib/members-store';

/**
 * Phase 13 — OTP registration.
 * POST /api/member-auth/register { name, phone?, email? }
 * At least one of phone/email required. Creates an UNVERIFIED member,
 * issues a 6-digit OTP (5-min expiry, 60s resend cooldown) and sends it
 * via SMS or email — demo banner (with the code) when no provider configured.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = body.phone != null && String(body.phone).trim() !== '' ? normalizeDestination(String(body.phone)) : null;
  const email = body.email != null && String(body.email).trim() !== '' ? String(body.email).trim().toLowerCase() : null;

  if (!name) return err('আপনার নাম লিখুন');
  if (!phone && !email) return err('মোবাইল নম্বর অথবা ইমেইল — অন্তত একটি দিন');
  if (phone && !validPhone(phone)) return err('সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)');
  if (email && !validEmail(email)) return err('সঠিক ইমেইল ঠিকানা দিন');

  if (phone && (await getMemberRowByPhone(phone))) {
    return NextResponse.json(
      { error: 'এই নম্বর দিয়ে আগেই নিবন্ধন করা হয়েছে — কোড দিয়ে প্রবেশ করুন', code: 'exists' },
      { status: 409 }
    );
  }
  if (email && (await getMemberRowByEmail(email))) {
    return NextResponse.json(
      { error: 'এই ইমেইল দিয়ে আগেই নিবন্ধন করা হয়েছে — কোড দিয়ে প্রবেশ করুন', code: 'exists' },
      { status: 409 }
    );
  }

  const row = await createAuthMemberRow({ name, phone, email });
  void row;

  // OTP goes to phone first, else email.
  const destination = phone ?? email!;
  const issued = await issueOtp(destination, 'register');
  if (!issued.ok) {
    return NextResponse.json(
      { error: issued.error, retry_after_ms: issued.retry_after_ms },
      { status: issued.retry_after_ms ? 429 : 400 }
    );
  }

  const sent = destination.includes('@') ? await sendEmail(destination, issued.code) : await sendSms(destination, issued.code);

  return ok({
    ok: true,
    destination,
    channel: destination.includes('@') ? 'email' : 'sms',
    purpose: 'register',
    demo: sent.demo,
    demo_code: sent.demo ? issued.code : undefined,
    demo_reason: sent.demo ? sent.reason : undefined,
    expires_in_ms: 5 * 60 * 1000,
  });
}
