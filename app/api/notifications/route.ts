import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { getNotifications } from '@/lib/push';

/**
 * Phase 8 — in-app notification center feed. Public, login-free.
 * ?since=<ISO> → unread counts only notifications newer than that stamp
 * (the client stores its last-read stamp in localStorage).
 */
export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since') || '';
  const notifications = await getNotifications(30);
  const unread = since ? notifications.filter((n) => n.created_at > since).length : notifications.length;
  return ok({ notifications, unread });
}
