import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember, memberSelfPayload } from '@/lib/member-session';
import { rowToMember, updateMemberRow } from '@/lib/members-store';
import type { LocationIds } from '@/lib/types';

export async function GET() {
  const member = await getSessionMember();
  if (!member) return err('লগইন করা নেই', 401);
  return ok(await memberSelfPayload(member));
}

export async function PATCH(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('লগইন করা নেই', 401);
  const body = await req.json().catch(() => ({}));
  const patch: { name?: string; is_visible?: boolean; current?: LocationIds } = {};
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.is_visible === 'boolean') patch.is_visible = body.is_visible;
  if (body.current && typeof body.current === 'object') {
    const o = body.current as Record<string, unknown>;
    const n = (x: unknown) => {
      const num = Number(x);
      return x != null && x !== '' && !Number.isNaN(num) ? num : null;
    };
    patch.current = {
      division_id: n(o.division_id),
      district_id: n(o.district_id),
      upazila_id: n(o.upazila_id),
      thana_id: n(o.thana_id),
      union_id: n(o.union_id),
    };
  }
  const row = await updateMemberRow(member.id, patch);
  if (!row) return err('সদস্য পাওয়া যায়নি', 404);
  return ok(await memberSelfPayload(rowToMember(row)));
}
