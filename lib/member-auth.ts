import { SignJWT, jwtVerify } from 'jose';

/**
 * Member session (Phase 3). Identity = registered phone number (no OTP,
 * demo-grade by design). The token is delivered both as an httpOnly cookie
 * and in the JSON response so the client can keep it in localStorage and
 * send it back as the `x-member-token` header.
 */

export const MEMBER_COOKIE = 'jk_member';

function getMemberSecret(): Uint8Array {
  const s =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'demo-secret-not-for-production';
  return new TextEncoder().encode(`${s}:member`);
}

export async function createMemberToken(memberId: number): Promise<string> {
  return new SignJWT({ mid: memberId, purpose: 'member' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getMemberSecret());
}

export async function verifyMemberToken(token: string | undefined | null): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getMemberSecret());
    if (payload.purpose !== 'member') return null;
    const mid = Number(payload.mid);
    return Number.isNaN(mid) ? null : mid;
  } catch {
    return null;
  }
}
