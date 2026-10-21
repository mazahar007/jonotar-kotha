'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconAlert, IconChevronRight, IconX } from './icons';

interface Broadcast {
  id: number;
  title: string;
  body: string;
}

const DISMISS_KEY = 'jk-dismissed-broadcasts';

/**
 * Phase 9 — home page top banner.
 * Shows active broadcasts for the user's selected area. The app's home
 * screen has no global area selector, so the banner follows the app's
 * default area (ময়মনসিংহ বিভাগ → জেলা → সদর — the same preselect the
 * LocationPicker uses everywhere). Dismissible per broadcast (persisted
 * in localStorage); expired broadcasts disappear on their own via the
 * server-side expires_at filter. Amber/red styling, ≥44px tap target.
 */
export default function BroadcastBanner() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (raw) setDismissed(JSON.parse(raw) as number[]);
    } catch {
      /* ignore */
    }
    fetch('/api/broadcasts?division_id=8&district_id=1&upazila_id=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setBroadcasts(d);
      })
      .catch(() => {});
  }, []);

  function dismiss(id: number) {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  const visible = broadcasts.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  const b = visible[0];
  return (
    <div className="px-4 lg:px-6">
      <div
        role="alert"
        className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-l from-red-600 to-red-700 p-4 text-white shadow-lg shadow-red-200"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
          <IconAlert className="h-6 w-6" />
        </span>
        <Link href={`/broadcasts/${b.id}`} className="flex min-h-11 flex-1 items-center gap-2">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">📢 {b.title}</span>
            <span className="block truncate text-xs text-white/85">{b.body}</span>
          </span>
          <IconChevronRight className="h-5 w-5 shrink-0" />
        </Link>
        {visible.length > 1 && (
          <Link
            href="/broadcasts"
            className="flex min-h-11 shrink-0 items-center rounded-full bg-white/20 px-3 text-xs font-bold"
          >
            +{visible.length - 1}টি
          </Link>
        )}
        <button
          onClick={() => dismiss(b.id)}
          aria-label="ব্যানার বন্ধ করুন"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
