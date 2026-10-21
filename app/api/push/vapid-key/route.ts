import { ok } from '@/lib/api';

/**
 * Phase 8 — expose ONLY the public VAPID key so browsers can subscribe.
 * Public keys are public by design; the private key never leaves the server.
 */
export async function GET() {
  return ok({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
}
