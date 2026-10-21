import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { createBroadcast, getAllBroadcasts } from '@/lib/broadcasts';
import { sendBroadcast } from '@/lib/push';

/**
 * Phase 9 — admin broadcasts.
 * GET → all broadcasts (active + expired), newest first.
 * POST → create + broadcast via Phase 8 push infra (`sendBroadcast`
 * from lib/push.ts) with area targeting. When VAPID keys are absent the
 * delivery is recorded in the in-app center only and the response says
 * so honestly — never fake.
 */

function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই — অ্যাডমিন লগইন করুন', 401);
  return ok(await getAllBroadcasts());
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return err('অনুমতি নেই — অ্যাডমিন লগইন করুন', 401);
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    body?: unknown;
    division_id?: unknown;
    district_id?: unknown;
    upazila_id?: unknown;
    thana_id?: unknown;
    hours?: unknown;
    expires_at?: unknown;
  };
  const title = String(body.title ?? '').trim().slice(0, 120);
  const note = String(body.body ?? '').trim().slice(0, 500);
  if (!title || !note) return err('শিরোনাম ও বার্তা আবশ্যক');

  const scope = {
    division_id: num(body.division_id),
    district_id: num(body.district_id),
    upazila_id: num(body.upazila_id),
    thana_id: num(body.thana_id),
  };

  // Expiry: explicit ISO wins, else hours from now (default 24).
  let expiresAt = String(body.expires_at ?? '').trim();
  if (!expiresAt) {
    const hours = num(body.hours) ?? 24;
    expiresAt = new Date(Date.now() + Math.max(1, hours) * 3_600_000).toISOString();
  }
  if (Number.isNaN(new Date(expiresAt).getTime())) return err('মেয়াদের তারিখ ঠিক নেই');

  const broadcast = await createBroadcast({ title, body: note, scope, expires_at: expiresAt });

  // Phase 8 infra, internally: push (when VAPID keys exist) + always
  // the in-app center, area-targeted to matching subscribers.
  const delivery = await sendBroadcast({
    title,
    body: note,
    url: `/broadcasts/${broadcast.id}`,
    kind: 'emergency',
    scope,
  });

  return ok({ broadcast, delivery });
}
