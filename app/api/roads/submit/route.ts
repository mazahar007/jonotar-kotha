import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { award } from '@/lib/points';
import { createRoad, createRoadUpdate, getRoadDetail, getRoadRows } from '@/lib/roads-store';
import { ROAD_STATUSES, type RoadStatus } from '@/lib/types';

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/**
 * POST /api/roads/submit — Phase 17 "অবস্থা জানান" submit page.
 * A logged-in member posts a condition update; optionally creates the
 * place (road/spot) first. One award (+1 road_update) per successful post.
 *
 * Body: { road_id?, name?, kind?, division_id, district_id, upazila_id,
 *         thana_id, union_id, status, note?, media_url?, preset_key? }
 */
export async function POST(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('পোস্ট করতে লগিন করুন', 401);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = String(body.status || '') as RoadStatus;
  if (!ROAD_STATUSES.includes(status)) return err('সঠিক অবস্থা বেছে নিন');

  const presetKey = body.preset_key ? String(body.preset_key).slice(0, 64) : null;
  const note = String(body.note || '').trim() || (presetKey ? presetLabelFallback(presetKey) : '');
  if (!note) return err('অবস্থা বেছে নিন অথবা নোট লিখুন');

  let roadId = numOrNull(body.road_id);
  if (roadId == null) {
    const name = String(body.name || '').trim();
    if (!name) return err('জায়গার নাম দিন');
    const kind = body.kind === 'spot' ? 'spot' : 'road';
    const road = await createRoad({
      name: name.slice(0, 120),
      kind,
      locality_name: kind === 'spot' ? name.slice(0, 120) : null,
      from_place: null,
      to_place: null,
      division_id: numOrNull(body.division_id),
      district_id: numOrNull(body.district_id),
      upazila_id: numOrNull(body.upazila_id),
      thana_id: numOrNull(body.thana_id),
      union_id: numOrNull(body.union_id),
    });
    roadId = road.id;
  } else {
    const rows = await getRoadRows();
    if (!rows.some((r) => r.id === roadId)) return err('জায়গা পাওয়া যায়নি', 404);
  }

  const update = await createRoadUpdate(roadId, {
    status,
    note: note.slice(0, 500),
    media_url: body.media_url ? String(body.media_url).slice(0, 500) : null,
    reporter_name: member.name || 'বেনামী',
    preset_key: presetKey,
  });
  if (!update) return err('পোস্ট করা যায়নি', 500);

  // Phase 15: +১ পয়েন্ট (একবারই — refId দিয়ে idempotent)।
  const bonus = await award(member.id, 'road_update', {
    refType: 'road_update',
    refId: `update:${update.id}`,
  });

  const detail = await getRoadDetail(roadId);
  return ok({ roadId, detail, newBadges: bonus.newBadges }, 201);
}

function presetLabelFallback(key: string): string {
  // Light fallback if the client sent a preset key but no note text.
  return key.replace(/_/g, ' ');
}
