import { NextRequest, NextResponse } from 'next/server';
import { err, ok } from '@/lib/api';
import { verifyOtp, normalizeDestination, type OtpPurpose } from '@/lib/otp';
import { createMemberToken, MEMBER_COOKIE } from '@/lib/member-auth';
import { getSessionMemberRow } from '@/lib/member-session';
import { memberSelfPayload } from '@/lib/member-session';
import { getMemberRowByEmail, getMemberRowByPhone, markChannelVerified, rowToMember } from '@/lib/members-store';

const PURPOSES: OtpPurpose[] = ['register', 'login', 'verify_phone'];

function setSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
}

/**
 * Phase 13 — OTP verification (password-free, all flows).
 * POST /api/member-auth/verify-otp { destination, code, purpose }
 *
 * - purpose 'register' / 'login': verifies the OTP, marks the channel
 *   verified and creates a member session. THE USER'S RULE: phone verified
 *   → account_status='verified'; email-only verified → stays 'unverified'
 *   until a phone is verified (markChannelVerified enforces this).
 * - purpose 'verify_phone': caller must already be logged in; attaches /
 *   verifies the phone on their account (email-only → becomes verified).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const destination = normalizeDestination(body.destination);
  const code = String(body.code ?? '');
  const purpose = body.purpose as OtpPurpose;
  if (!destination || !code) return err('কোড পাঠানো হয়নি');
  if (!PURPOSES.includes(purpose)) return err('ভুল উদ্দেশ্য');

  const verified = await verifyOtp(destination, code, purpose);
  if (!verified.ok) {
    return NextResponse.json(
      { error: verified.error, attempts_left: verified.attempts_left },
      { status: 400 }
    );
  }

  const channel = destination.includes('@') ? 'email' : 'sms';

  if (purpose === 'verify_phone') {
    const sessionRow = await getSessionMemberRow();
    if (!sessionRow) return err('লগইন করা নেই', 401);
    if (channel !== 'sms') return err('ফোন নম্বর দিন');
    const updated = await markChannelVerified(sessionRow.id, 'sms', destination);
    if (!updated) return err('সদস্য পাওয়া যায়নি', 404);
    return ok({ member: await memberSelfPayload(rowToMember(updated)) });
  }

  const row = channel === 'email' ? await getMemberRowByEmail(destination) : await getMemberRowByPhone(destination);
  if (!row) return err('সদস্য পাওয়া যায়নি', 404);

  // Successful OTP to a phone proves phone ownership → phone_verified.
  // Successful OTP to an email only marks email_verified (stays unverified
  // per the user's rule until a phone is verified).
  const updated = await markChannelVerified(row.id, channel);
  if (!updated) return err('সদস্য পাওয়া যায়নি', 404);

  const member = rowToMember(updated);
  const token = await createMemberToken(member.id);
  const res = NextResponse.json({ member: await memberSelfPayload(member), token });
  setSessionCookie(res, token);
  return res;
}
