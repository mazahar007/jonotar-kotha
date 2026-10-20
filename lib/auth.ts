import { SignJWT, jwtVerify } from 'jose';

/**
 * Shared-passcode gate for the /admin panel (same pattern as the food-shop POS).
 * - Passcode comes from ADMIN_PASSCODE env var.
 * - Demo mode (no Supabase env vars, no ADMIN_PASSCODE): passcode is "1234".
 * - Supabase configured but no ADMIN_PASSCODE: logins are refused with a
 *   clear message telling the owner to set the env var.
 * Session = signed JWT in an httpOnly cookie. Edge-safe.
 */

export const SESSION_COOKIE = 'jk_session';
export const DEMO_PASSCODE = '1234';

function getSecret(): Uint8Array {
  const s =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'demo-secret-not-for-production';
  return new TextEncoder().encode(s);
}

export function isDemoMode(): boolean {
  return !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** The passcode that unlocks the admin panel, or null when login must be refused. */
export function getExpectedPasscode(): string | null {
  if (process.env.ADMIN_PASSCODE) return process.env.ADMIN_PASSCODE;
  if (isDemoMode()) return DEMO_PASSCODE;
  return null;
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}
