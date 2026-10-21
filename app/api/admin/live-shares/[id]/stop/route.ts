import { err, ok, requireAdmin } from '@/lib/api';
import { stopLiveShare } from '@/lib/live-shares';

/** Admin force-stop of any active live share (no owner_token needed). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id } = await params;
  const result = await stopLiveShare(id, null, { admin: true });
  if (result === 'not_found') return err('শেয়ারটি পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
