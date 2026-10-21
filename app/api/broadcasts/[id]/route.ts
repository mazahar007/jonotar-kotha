import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getBroadcast } from '@/lib/broadcasts';

/** Phase 9 — public broadcast detail (active or expired). */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getBroadcast(Number(id));
  if (!b) return err('ঘোষণা পাওয়া যায়নি', 404);
  return ok(b);
}
