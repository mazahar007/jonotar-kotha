import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { createRoadUpdate, getRoadDetail } from '@/lib/roads-store';
import { ROAD_STATUSES, type RoadStatus } from '@/lib/types';

/**
 * POST /api/roads/[id]/updates — public "লাইভ আপডেট দিন".
 * Same openness as report submission: anyone may post; a member session is
 * optional. The new update becomes the road's current status.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roadId = Number(id);
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '') as RoadStatus;
  if (!ROAD_STATUSES.includes(status)) return err('সঠিক অবস্থা বেছে নিন');
  const note = String(body.note || '').trim();
  if (!note) return err('আপডেটের বিবরণ লিখুন');
  const reporter = String(body.reporter_name || '').trim();
  const update = await createRoadUpdate(roadId, {
    status,
    note,
    media_url: body.media_url ? String(body.media_url) : null,
    reporter_name: reporter || 'বেনামী',
  });
  if (!update) return err('রোড পাওয়া যায়নি', 404);
  // Return the refreshed detail so the client updates status + timeline at once.
  return ok(await getRoadDetail(roadId), 201);
}
