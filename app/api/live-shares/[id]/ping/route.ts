import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { pingLiveShare } from '@/lib/live-shares';

function validCoord(v: unknown, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
}

/** Owner-only position update. Requires the owner_token from share creation. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const token = String(body.owner_token || req.headers.get('x-owner-token') || '');
  if (!token) return err('owner_token প্রয়োজন', 403);
  if (!validCoord(body.lat, 90) || !validCoord(body.lng, 180)) {
    return err('সঠিক লোকেশন পাঠান', 400);
  }
  const { result, updated_at } = await pingLiveShare(
    id,
    token,
    body.lat,
    body.lng,
    typeof body.accuracy === 'number' && Number.isFinite(body.accuracy) ? body.accuracy : null
  );
  if (result === 'not_found') return err('শেয়ারটি পাওয়া যায়নি', 404);
  if (result === 'forbidden') return err('অনুমতি নেই', 403);
  if (result === 'inactive') return err('শেয়ারটি বন্ধ বা মেয়াদ শেষ', 409);
  return ok({ ok: true, updated_at });
}
