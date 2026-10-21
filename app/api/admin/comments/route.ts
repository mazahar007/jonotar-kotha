import { err, ok, requireAdmin } from '@/lib/api';
import { listAdminComments } from '@/lib/report-comments';

export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  return ok(await listAdminComments());
}
