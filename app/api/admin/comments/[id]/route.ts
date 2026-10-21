import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { deleteComment } from '@/lib/report-comments';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const id = Number((await params).id);
  if (!Number.isFinite(id)) return err('ভুল মন্তব্য');
  const done = await deleteComment(id);
  if (!done) return err('মোছা যায়নি', 404);
  return ok({ ok: true });
}
