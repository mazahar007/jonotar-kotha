import { err, ok, requireAdmin } from '@/lib/api';
import { listAllContacts } from '@/lib/trusted-contacts';

/**
 * Phase 11 — admin read of all trusted contacts.
 * Logged-out callers → 401; never exposed through any public route.
 */
export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  return ok(await listAllContacts());
}
