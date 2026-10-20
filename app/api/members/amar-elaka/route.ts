import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { computeAmarElaka } from '@/lib/members-store';

/**
 * আমার এলাকার মানুষ — computed automatically from members' home vs current
 * areas. Current area is the member's SELF-DECLARED area, not GPS.
 */
export async function GET() {
  const member = await getSessionMember();
  if (!member) return err('আপনার এলাকার মানুষ দেখতে নিবন্ধন করুন', 401);
  return ok(await computeAmarElaka(member));
}
