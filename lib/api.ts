import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from './auth';
import { getSupabase } from './supabase';

export function ok(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function err(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function requireAdmin(): Promise<boolean> {
  const c = await cookies();
  return verifySession(c.get(SESSION_COOKIE)?.value);
}

/** Returns the service-role Supabase client, or a 503 response when not configured. */
export function needSupa() {
  const s = getSupabase();
  if (!s) return { supa: null, res: err('Supabase কনফিগার করা হয়নি', 503) };
  return { supa: s, res: null };
}
