import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { saveSubscription } from '@/lib/push';

/**
 * Phase 8 — register a browser's VAPID push subscription.
 * Public (login-free), like the rest of the citizen-facing app.
 * Same endpoint re-subscribing upserts (UNIQUE(endpoint)).
 */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown } | null;
    member_id?: unknown;
  };
  const endpoint = String(body.endpoint ?? '').trim();
  const p256dh = String(body.keys?.p256dh ?? '').trim();
  const auth = String(body.keys?.auth ?? '').trim();
  if (!endpoint || !p256dh || !auth) return err('সাবস্ক্রিপশন তথ্য অসম্পূর্ণ');
  if (endpoint.length > 2000 || p256dh.length > 512 || auth.length > 512)
    return err('সাবস্ক্রিপশন তথ্য অস্বাভাবিক');
  const memberId = typeof body.member_id === 'number' ? body.member_id : null;
  await saveSubscription({ endpoint, p256dh, auth, member_id: memberId });
  return ok({ saved: true });
}
