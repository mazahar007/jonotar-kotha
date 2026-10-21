import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { getSubscriptions, sendBroadcast, vapidConfigured } from '@/lib/push';

/**
 * Phase 8 — broadcast a notification.
 * Admin-gated (requireAdmin + middleware): only the admin panel may send.
 *
 * POST → sends to all subscribers. When VAPID keys are absent the message
 * is written to the in-app center ONLY and the response says so honestly:
 * { delivered: 'inapp', reason: 'no-vapid-keys' } — never fake.
 * GET (admin) → stats for the admin panel: subscriber count + VAPID status.
 */
export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই — অ্যাডমিন লগইন করুন', 401);
  const subs = await getSubscriptions();
  return ok({ subscriptions: subs.length, vapidConfigured: vapidConfigured() });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return err('অনুমতি নেই — অ্যাডমিন লগইন করুন', 401);
  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown;
    body?: unknown;
    url?: unknown;
  };
  const title = String(body.title ?? '').trim().slice(0, 120);
  const note = String(body.body ?? '').trim().slice(0, 500);
  const url = String(body.url ?? '/').trim().slice(0, 500) || '/';
  if (!title || !note) return err('শিরোনাম ও বার্তা আবশ্যক');
  const result = await sendBroadcast({ title, body: note, url });
  return ok(result);
}
