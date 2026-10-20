import { NextRequest, NextResponse } from 'next/server';
import { err } from '@/lib/api';
import { createMemberToken, MEMBER_COOKIE } from '@/lib/member-auth';
import { memberSelfPayload } from '@/lib/member-session';
import { getMemberRowByPhone, normalizePhone, rowToMember } from '@/lib/members-store';

/** Phone-number login (no OTP, demo-grade): re-issues a session for an existing member. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = normalizePhone(body.phone);
  if (!phone) return err('মোবাইল নম্বর দিন');
  const row = await getMemberRowByPhone(phone);
  if (!row) return err('এই নম্বর দিয়ে কোনো নিবন্ধন পাওয়া যায়নি — আগে নিবন্ধন করুন', 404);
  const member = rowToMember(row);
  const token = await createMemberToken(member.id);
  const res = NextResponse.json({ member: await memberSelfPayload(member), token });
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
