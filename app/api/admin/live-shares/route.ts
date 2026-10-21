import { err, ok, requireAdmin } from '@/lib/api';
import { listAdminLiveShares } from '@/lib/live-shares';

/** Admin SOS-inbox list of live shares (sanitized — no owner_token). */
export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  return ok(await listAdminLiveShares());
}
