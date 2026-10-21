import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { stopLiveShare } from '@/lib/live-shares';

/** Owner-only stop. Idempotent — stopping an already-stopped share is fine. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const token = String(body.owner_token || req.headers.get('x-owner-token') || '');
  if (!token) return err('owner_token প্রয়োজন', 403);
  const result = await stopLiveShare(id, token);
  if (result === 'not_found') return err('শেয়ারটি পাওয়া যায়নি', 404);
  if (result === 'forbidden') return err('অনুমতি নেই', 403);
  return ok({ ok: true });
}
