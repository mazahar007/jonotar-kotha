import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { err } from '@/lib/api';
import { createSessionToken, getExpectedPasscode, SESSION_COOKIE } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { passcode } = (await req.json().catch(() => ({}))) as { passcode?: string };
  const expected = getExpectedPasscode();
  if (!expected) {
    return err('ADMIN_PASSCODE সেট করুন (Vercel Environment Variables)', 503);
  }
  const a = Buffer.from(String(passcode || ''));
  const b = Buffer.from(expected);
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) return err('ভুল পাসকোড', 401);

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
