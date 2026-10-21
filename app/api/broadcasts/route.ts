import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { getActiveBroadcasts, type AreaScope } from '@/lib/broadcasts';

/**
 * Phase 9 — public feed of ACTIVE emergency broadcasts.
 * GET /api/broadcasts?division_id=&district_id=&upazila_id=&thana_id=
 * Area params are optional: without them only nationwide broadcasts
 * (all scope levels null) are returned. Never 500s — demo fallback
 * seeds 1 active broadcast (বন্যা সতর্কতা, ময়মনসিংহ সদর).
 */
function num(v: string | null): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const hasArea =
    q.has('division_id') || q.has('district_id') || q.has('upazila_id') || q.has('thana_id');
  const area: AreaScope | undefined = hasArea
    ? {
        division_id: num(q.get('division_id')),
        district_id: num(q.get('district_id')),
        upazila_id: num(q.get('upazila_id')),
        thana_id: num(q.get('thana_id')),
      }
    : undefined;
  return ok(await getActiveBroadcasts(area));
}
