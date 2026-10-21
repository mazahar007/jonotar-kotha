import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { award, touchActivity } from '@/lib/points';
import { createRoad, createRoadUpdate, getRoadDetail, getRoadRows } from '@/lib/roads-store';
import { breadcrumb, locationNameMaps } from '@/lib/members-store';
import { presetByKey } from '@/lib/presets';
import type { LocationIds, Member } from '@/lib/types';

const AREA_KEYS = ['division_id', 'district_id', 'upazila_id', 'thana_id', 'union_id'] as const;

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function numParam(req: NextRequest, key: string): number | null {
  return numOrNull(req.nextUrl.searchParams.get(key));
}

/** Target area = request override when any id is given, else the member's current area (Phase 3 self-declared). */
function targetArea(body: Record<string, unknown>, member: Member): LocationIds {
  const hasAny = AREA_KEYS.some((k) => body[k] != null && body[k] !== '');
  if (!hasAny) return member.current;
  return {
    division_id: numOrNull(body.division_id),
    district_id: numOrNull(body.district_id),
    upazila_id: numOrNull(body.upazila_id),
    thana_id: numOrNull(body.thana_id),
    union_id: numOrNull(body.union_id),
  };
}

async function areaLabel(ids: LocationIds): Promise<string> {
  const maps = await locationNameMaps();
  return breadcrumb(ids, maps) || 'সাধারণ এলাকা';
}

function sameArea(r: { division_id: number | null; district_id: number | null; upazila_id: number | null; thana_id: number | null; union_id: number | null }, a: LocationIds): boolean {
  return (
    r.division_id === a.division_id &&
    r.district_id === a.district_id &&
    r.upazila_id === a.upazila_id &&
    r.thana_id === a.thana_id &&
    r.union_id === a.union_id
  );
}

/**
 * GET /api/roads/quick-post — public: resolve a Bengali area label from
 * location ids (used by the এক-ট্যাপ strip after বদলাও).
 */
export async function GET(req: NextRequest) {
  const ids: LocationIds = {
    division_id: numParam(req, 'division_id'),
    district_id: numParam(req, 'district_id'),
    upazila_id: numParam(req, 'upazila_id'),
    thana_id: numParam(req, 'thana_id'),
    union_id: numParam(req, 'union_id'),
  };
  return ok({ label: await areaLabel(ids) });
}

/**
 * POST /api/roads/quick-post — Phase 14 "⚡ এক ট্যাপে জানান".
 * A logged-in member taps a preset → posts instantly to their current area
 * (or the area chosen via বদলাও). The server finds-or-creates an area-level
 * "spot" entry for that area, then appends the preset update to it.
 *
 * Login gating: REQUIRES a member session (401 otherwise). Demo-mode
 * sessions count as logged in. Gating choice: ANY logged-in member, NOT
 * verified-only — the demo member row is `unverified`, so verified-only
 * would break demo posting (brief: "demo member session counts as logged in").
 */
export async function POST(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('পোস্ট করতে লগিন করুন', 401);

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const preset = presetByKey(String(body.preset_key || ''));
  if (!preset) return err('সঠিক অপশন বেছে নিন');

  const area = targetArea(body, member);
  const label = await areaLabel(area);

  // Find-or-create the area-level spot entry (kind 'spot', named after the area).
  const rows = await getRoadRows();
  let road = rows.find((r) => r.kind === 'spot' && r.name === label && sameArea(r, area));
  if (!road) {
    road = await createRoad({
      name: label,
      kind: 'spot',
      locality_name: label,
      from_place: null,
      to_place: null,
      division_id: area.division_id,
      district_id: area.district_id,
      upazila_id: area.upazila_id,
      thana_id: area.thana_id,
      union_id: area.union_id,
    });
  }

  // Server-side double-tap guard: same preset on the same entry within 60s
  // returns the existing update instead of creating a duplicate.
  const detail = await getRoadDetail(road.id);
  const latest = detail?.latest_update;
  if (
    latest &&
    latest.preset_key === preset.key &&
    Date.now() - new Date(latest.created_at).getTime() < 60_000
  ) {
    // ডুপ্লিকেট ট্যাপ: নতুন আপডেট নয়, পয়েন্টও নয় — শুধু নিষ্ক্রিয়তা নিয়ম।
    await touchActivity(member.id);
    return ok({ duplicate: true, detail });
  }

  await createRoadUpdate(road.id, {
    status: preset.status,
    note: preset.label,
    media_url: null,
    reporter_name: member.name || 'বেনামী',
    preset_key: preset.key,
  });
  // Phase 15: এক-ট্যাপ পোস্টে +১ পয়েন্ট (ডাবল-ট্যাপ ডুপ্লিকেটে নয় — ওপরে
  // duplicate=true রিটার্নে আগেই ফেরত গেছে)।
  const newDetail = await getRoadDetail(road.id);
  const updateId = newDetail?.updates?.[0]?.id ?? newDetail?.latest_update?.id;
  const bonus =
    updateId != null
      ? await award(member.id, 'road_update', { refType: 'road_update', refId: `update:${updateId}` })
      : { newBadges: [] as string[] };
  return ok({ duplicate: false, detail: newDetail, newBadges: bonus.newBadges }, 201);
}
