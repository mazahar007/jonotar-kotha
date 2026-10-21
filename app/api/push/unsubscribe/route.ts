import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { removeSubscription } from '@/lib/push';

/** Phase 8 — remove a browser's push subscription. Public, login-free. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { endpoint?: unknown };
  const endpoint = String(body.endpoint ?? '').trim();
  if (!endpoint) return err('endpoint আবশ্যক');
  await removeSubscription(endpoint);
  return ok({ removed: true });
}
