import { err, ok } from '@/lib/api';
import { getLiveShareRow, sanitizePublic } from '@/lib/live-shares';

/** Public viewer payload — sanitized (no owner_token; phone only if opted in). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await getLiveShareRow(id);
  if (!row) return err('শেয়ারটি পাওয়া যায়নি', 404);
  return ok(sanitizePublic(row));
}
