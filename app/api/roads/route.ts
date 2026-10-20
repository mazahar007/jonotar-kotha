import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { createRoad, getRoads } from '@/lib/roads-store';
import type { LocationIds, RoadKind } from '@/lib/types';

function numParam(req: NextRequest, key: string): number | null {
  const raw = req.nextUrl.searchParams.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** GET /api/roads — public list with hierarchy filters + optional ?kind=road|spot
    (absent = all); each road carries its current status (latest update),
    latest update and update count. */
export async function GET(req: NextRequest) {
  const kindRaw = req.nextUrl.searchParams.get('kind');
  const filters: Partial<LocationIds> & { kind?: RoadKind } = {
    division_id: numParam(req, 'division_id'),
    district_id: numParam(req, 'district_id'),
    upazila_id: numParam(req, 'upazila_id'),
    thana_id: numParam(req, 'thana_id'),
    union_id: numParam(req, 'union_id'),
    ...(kindRaw === 'road' || kindRaw === 'spot' ? { kind: kindRaw as RoadKind } : {}),
  };
  return ok(await getRoads(filters));
}

/** POST /api/roads — admin creates a road or a spot (গুরুত্বপূর্ণ স্থান/মোড়). */
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  if (!name) return err('নাম আবশ্যক');
  const row = await createRoad({
    name,
    kind: body.kind === 'spot' ? 'spot' : 'road',
    locality_name: body.locality_name ? String(body.locality_name).trim() || null : null,
    from_place: body.from_place ? String(body.from_place).trim() || null : null,
    to_place: body.to_place ? String(body.to_place).trim() || null : null,
    division_id: numOrNull(body.division_id),
    district_id: numOrNull(body.district_id),
    upazila_id: numOrNull(body.upazila_id),
    thana_id: numOrNull(body.thana_id),
    union_id: numOrNull(body.union_id),
  });
  return ok(row, 201);
}
