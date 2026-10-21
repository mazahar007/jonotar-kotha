'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconBell } from './icons';
import { bnNum } from '@/lib/time';

export const NOTIF_LAST_READ_KEY = 'jk_notif_last_read';

/**
 * Phase 8 — header bell with unread badge → /notifications.
 * Unread is computed server-side from the last-read stamp the client keeps
 * in localStorage (same pattern as lib/voter.ts / lib/member.ts).
 */
export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const since = localStorage.getItem(NOTIF_LAST_READ_KEY) || '';
        const res = await fetch(
          `/api/notifications${since ? `?since=${encodeURIComponent(since)}` : ''}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (alive && data && typeof data.unread === 'number') setUnread(data.unread);
      } catch {
        /* bell stays badge-free on failure */
      }
    }
    load();
    const t = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <Link
      href="/notifications"
      aria-label="নোটিফিকেশন"
      className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink shadow-sm"
    >
      <IconBell className="h-5 w-5" />
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
          {unread > 99 ? '৯৯+' : bnNum(unread)}
        </span>
      )}
    </Link>
  );
}
