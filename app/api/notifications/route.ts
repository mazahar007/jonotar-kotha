import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { getNotifications } from '@/lib/push';
import { getSessionMember } from '@/lib/member-session';

/**
 * Phase 8 — in-app notification center feed. Public, login-free.
 * ?since=<ISO> → unread counts only notifications newer than that stamp
 * (the client stores its last-read stamp in localStorage).
 * Phase 18 — logged-in members also see notifications targeted to them
 * (member_id set); logged-out visitors see global ones only.
 */
export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since') || '';
  const member = await getSessionMember().catch(() => null);
  const notifications = await getNotifications(30, member?.id ?? null);
  const unread = since ? notifications.filter((n) => n.created_at > since).length : notifications.length;
  return ok({ notifications, unread });
}
