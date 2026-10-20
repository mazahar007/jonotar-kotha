import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { deleteRoad, getRoadDetail, updateRoad } from '@/lib/roads-store';
import type { RoadInput } from '@/lib/roads-store';

/** GET /api/roads/[id] — public: road + full update timeline (newest first). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getRoadDetail(Number(id));
  if (!detail) return err('রোড পাওয়া যায়নি', 404);
  return ok(detail);
}

const EDITABLE: (keyof RoadInput)[] = [
  'name',
  'kind',
  'locality_name',
  'from_place',
  'to_place',
  'division_id',
  'district_id',
  'upazila_id',
  'thana_id',
  'union_id',
];

/** PATCH /api/roads/[id] — admin edits a road/spot. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Partial<RoadInput> = {};
  for (const k of EDITABLE) {
    if (body[k] === undefined) continue;
    if (k === 'kind') {
      patch.kind = body.kind === 'spot' ? 'spot' : 'road';
    } else if (k === 'name' || k === 'from_place' || k === 'to_place' || k === 'locality_name') {
      const v = String(body[k] ?? '').trim();
      patch[k] = (k === 'name' ? v : v || null) as never;
    } else {
      const n = body[k] == null || body[k] === '' ? null : Number(body[k]);
      patch[k] = (Number.isNaN(n as number) ? null : n) as never;
    }
  }
  if (patch.name !== undefined && !patch.name) return err('রোডের নাম আবশ্যক');
  const row = await updateRoad(Number(id), patch);
  if (!row) return err('রোড পাওয়া যায়নি', 404);
  return ok(row);
}

/** DELETE /api/roads/[id] — admin removes a road (and its updates). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id } = await params;
  const done = await deleteRoad(Number(id));
  if (!done) return err('রোড পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
