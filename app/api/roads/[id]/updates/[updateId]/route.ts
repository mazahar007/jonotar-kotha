import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { deleteRoadUpdate } from '@/lib/roads-store';

/** DELETE /api/roads/[id]/updates/[updateId] — admin moderation. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; updateId: string }> }
) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id, updateId } = await params;
  const done = await deleteRoadUpdate(Number(id), Number(updateId));
  if (!done) return err('আপডেট পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
