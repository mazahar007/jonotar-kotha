import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { deleteBroadcast } from '@/lib/broadcasts';

/** Phase 9 — delete a broadcast (admin only). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return err('অনুমতি নেই — অ্যাডমিন লগইন করুন', 401);
  const { id } = await params;
  const n = Number(id);
  if (!Number.isFinite(n)) return err('ভুল আইডি');
  const removed = await deleteBroadcast(n);
  if (!removed) return err('ঘোষণা পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
