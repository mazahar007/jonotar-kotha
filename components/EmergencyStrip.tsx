'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { MunicipalityUpdate } from '@/lib/types';
import { IconAlert, IconMegaphone, IconPhone, IconShield, IconX } from './icons';

interface Broadcast {
  id: number;
  title: string;
  body: string;
}

const DISMISS_KEY = 'jk-dismissed-broadcasts';

/**
 * Phase 21d — unified emergency quick-action strip (user-annotated correction).
 * Phase 21q: ALL 4 columns follow the সমাধান ট্র্যাকার card style per user
 * ("সবগুলো এই স্টাইলে হবে। টেক্সট এন্ড ডিজাইন। বক্সের ৪ কোনা ২০ pixels radio"):
 * icon-left header row + dark inner box (rounded 20px) + blue link.
 * Tracker column's strip-level anchor was removed with the right-rail card;
 * its inner box now links to /reports.
 */
export default function EmergencyStrip({ updates }: { updates: MunicipalityUpdate[] }) {
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
  const b = visible[0];
  const latestUpdate = updates[0];

  return (
    <section aria-label="জরুরি সেবা" className="emergency-strip overflow-hidden rounded-[20px]">
      <div className="grid grid-cols-2 divide-x divide-y divide-[var(--strip-divide)] lg:grid-cols-4 lg:divide-y-0">
        {/* 1 — জরুরি সতর্কতা (active broadcast, dismissible) */}
        <div className="emergency-strip-col relative flex min-h-[168px] flex-col gap-3 px-4 py-5 text-left">
          <div className="flex items-start gap-3">
            <span className="emergency-strip-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <IconAlert className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-snug text-ink">জরুরি সতর্কতা</h2>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">এলাকার জরুরি ঘোষণা</p>
            </div>
          </div>
          <Link
            href={b ? `/broadcasts/${b.id}` : '/broadcasts'}
            aria-label={b ? `সতর্কতা: ${b.title}` : 'জরুরি সতর্কতা'}
            className="flex w-full gap-3 rounded-[20px] bg-cream p-3 text-sm"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-500" />
            <p className="text-ink-soft">{b ? `${b.title} — ${b.body}` : 'সক্রিয় সতর্কতা নেই'}</p>
          </Link>
          <Link
            href="/broadcasts"
            className="block text-center text-sm font-bold text-brand"
          >
            সব সতর্কতা দেখুন →
          </Link>
          {b && (
            <button
              type="button"
              onClick={() => dismiss(b.id)}
              aria-label="সতর্কতা বন্ধ করুন"
              className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white/80 transition hover:bg-black/40 hover:text-white"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2 — জরুরি কল */}
        <div className="emergency-strip-col flex min-h-[168px] flex-col gap-3 px-4 py-5 text-left">
          <div className="flex items-start gap-3">
            <span className="emergency-strip-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <IconPhone className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-snug text-ink">জরুরি কল</h2>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">১ ট্যাপে কল করুন</p>
            </div>
          </div>
          <Link
            href="/sos"
            aria-label="জরুরি কল — ১ ট্যাপে কল"
            className="flex w-full gap-3 rounded-[20px] bg-cream p-3 text-sm"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
            <p className="text-ink-soft">জরুরি হটলাইন: ৯৯৯ · ১০৯ · ৩৩৩</p>
          </Link>
          <Link
            href="/sos"
            className="block text-center text-sm font-bold text-brand"
          >
            এখনই কল করুন →
          </Link>
        </div>

        {/* 3 — ভ্রমণ মোড */}
        <div className="emergency-strip-col flex min-h-[168px] flex-col gap-3 px-4 py-5 text-left">
          <div className="flex items-start gap-3">
            <span className="emergency-strip-chip flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
              <IconMegaphone className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-snug text-ink">ভ্রমণ মোড</h2>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">গাইড ও নিরাপদ আশ্রয়</p>
            </div>
          </div>
          <Link
            href="/travel"
            aria-label="ভ্রমণ মোড"
            className="flex w-full gap-3 rounded-[20px] bg-cream p-3 text-sm"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
            <p className="text-ink-soft">পরিবারের সাথে লাইভ লোকেশন শেয়ার করুন</p>
          </Link>
          <Link
            href="/travel"
            className="block text-center text-sm font-bold text-brand"
          >
            ভ্রমণ শুরু করুন →
          </Link>
        </div>

        {/* 4 — সমাধান ট্র্যাকার: exact tracker-card style (user 2026-10-22) */}
        <div className="emergency-strip-col flex min-h-[168px] flex-col gap-3 px-4 py-5 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <IconShield className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[22px] font-bold leading-snug text-ink">সমাধান ট্র্যাকার</h2>
              <p className="mt-0.5 text-sm leading-snug text-ink-soft">পৌরসভা কোন রিপোর্টে কী করল</p>
            </div>
          </div>
          <Link
            href="/reports"
            aria-label="সমাধান ট্র্যাকার দেখুন"
            className="flex w-full gap-3 rounded-[20px] bg-cream p-3 text-sm"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <p className="text-ink-soft">
              {latestUpdate ? latestUpdate.note : 'পৌরসভার পদক্ষেপ দেখুন'}
            </p>
          </Link>
          <Link
            href="/report"
            className="block text-center text-sm font-bold text-brand"
          >
            পৌরসভাকে ট্যাগ করুন →
          </Link>
        </div>
      </div>
    </section>
  );
}
