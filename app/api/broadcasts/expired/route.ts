import { err, ok } from '@/lib/api';
import { getAllBroadcasts } from '@/lib/broadcasts';

/** Phase 9 — recently expired broadcasts (public, newest first). */
export async function GET() {
  try {
    const all = await getAllBroadcasts();
    const now = Date.now();
    return ok(all.filter((b) => new Date(b.expires_at).getTime() <= now).slice(0, 20));
  } catch {
    return err('লোড করা যায়নি', 500);
  }
}
