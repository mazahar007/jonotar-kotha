import { cookies, headers } from 'next/headers';
import { MEMBER_COOKIE, verifyMemberToken } from './member-auth';
import { breadcrumb, getMemberRowById, locationNameMaps, rowToMember } from './members-store';
import type { MemberRow } from './members-fallback';
import type { Member } from './types';

/** Resolve the logged-in member from the `jk_member` cookie or `x-member-token` header. */
export async function getSessionMemberRow(): Promise<MemberRow | null> {
  const h = await headers();
  const c = await cookies();
  const token = h.get('x-member-token') || c.get(MEMBER_COOKIE)?.value;
  const mid = await verifyMemberToken(token ?? undefined);
  if (mid == null) return null;
  return getMemberRowById(mid);
}

export async function getSessionMember(): Promise<Member | null> {
  const row = await getSessionMemberRow();
  return row ? rowToMember(row) : null;
}

/** Payload for the member themselves (includes their own phone + breadcrumbs). */
export async function memberSelfPayload(m: Member) {
  const maps = await locationNameMaps();
  return {
    id: m.id,
    name: m.name,
    phone: m.phone,
    home: m.home,
    current: m.current,
    is_visible: m.is_visible,
    created_at: m.created_at,
    home_breadcrumb: breadcrumb(m.home, maps),
    current_breadcrumb: breadcrumb(m.current, maps),
  };
}

export type MemberSelfPayload = Awaited<ReturnType<typeof memberSelfPayload>>;
