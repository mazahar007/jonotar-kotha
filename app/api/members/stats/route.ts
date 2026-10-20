import { ok } from '@/lib/api';
import { getMemberStats } from '@/lib/members-store';

/** Public aggregates only: total members + per-district counts. No personal data. */
export async function GET() {
  return ok(await getMemberStats());
}
