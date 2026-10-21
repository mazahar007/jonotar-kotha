import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { createRoadUpdate, getRoadDetail } from '@/lib/roads-store';
import { getSessionMember } from '@/lib/member-session';
import { award } from '@/lib/points';
import { ROAD_STATUSES, type RoadStatus } from '@/lib/types';

/**
 * POST /api/roads/[id]/updates — "লাইভ আপডেট দিন".
 * Phase 14: REQUIRES a logged-in member session (401 otherwise). Demo-mode
 * sessions count as logged in. Gating choice: ANY logged-in member, NOT
 * verified-only — the demo member row is `unverified`, so verified-only
 * would break demo posting. Phase 5: one-tap presets post here too,
 * carrying `preset_key`.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const member = await getSessionMember();
  if (!member) return err('পোস্ট করতে লগিন করুন', 401);
  const { id } = await params;
  const roadId = Number(id);
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '') as RoadStatus;
  if (!ROAD_STATUSES.includes(status)) return err('সঠিক অবস্থা বেছে নিন');
  const note = String(body.note || '').trim();
  if (!note) return err('আপডেটের বিবরণ লিখুন');
  const reporter = String(body.reporter_name || '').trim();
  const presetKey = body.preset_key ? String(body.preset_key).slice(0, 64) : null;
  const update = await createRoadUpdate(roadId, {
    status,
    note,
    media_url: body.media_url ? String(body.media_url) : null,
    reporter_name: reporter || member.name || 'বেনামী',
    preset_key: presetKey,
  });
  if (!update) return err('রোড পাওয়া যায়নি', 404);
  // Phase 15: রোড আপডেটে +১ পয়েন্ট।
  const bonus = await award(member.id, 'road_update', {
    refType: 'road_update',
    refId: `update:${update.id}`,
  });
  // Return the refreshed detail so the client updates status + timeline at once.
  const detail = await getRoadDetail(roadId);
  return ok({ ...detail, newBadges: bonus.newBadges }, 201);
}
