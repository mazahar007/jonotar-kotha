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
 * ONE rounded-3xl red container, 4 equal columns with hairline dividers
 * (sample's stats-section pattern): বন্যা সতর্কতা / জরুরি কল / ভ্রমণ মোড /
 * সমাধান ট্র্যাকার. Deep-red in dark theme, light-red in light theme.
 * Replaces the old separate BroadcastBanner + emergency strip + travel teaser.
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
    <section aria-label="জরুরি সেবা" className="emergency-strip overflow-hidden rounded-3xl">
      <div className="grid grid-cols-2 divide-x divide-y divide-[var(--strip-divide)] lg:grid-cols-4 lg:divide-y-0">
        {/* 1 — সতর্কতা (active broadcast, dismissible) */}
        <div className="emergency-strip-col group relative flex min-h-[168px] flex-col items-center gap-2.5 px-4 py-8 text-center">
          <Link
            href={b ? `/broadcasts/${b.id}` : '/broadcasts'}
            aria-label={b ? `সতর্কতা: ${b.title}` : 'জরুরি সতর্কতা'}
            className="absolute inset-0 z-0"
          />
          <span className="emergency-strip-chip flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <IconAlert className="h-6 w-6" />
          </span>
          <span className="emergency-strip-title line-clamp-2 text-base font-bold leading-snug">
            {b ? b.title : 'জরুরি সতর্কতা'}
          </span>
          <span className="emergency-strip-sub line-clamp-2 max-w-full text-sm leading-snug">
            {b ? b.body : 'সক্রিয় সতর্কতা নেই'}
          </span>
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
        <div className="emergency-strip-col group relative flex min-h-[168px] flex-col items-center gap-2.5 px-4 py-8 text-center">
          <Link
            href="/sos"
            aria-label="জরুরি কল — ১ ট্যাপে কল"
            className="absolute inset-0 z-0"
          />
          <span className="emergency-strip-chip flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
            <IconPhone className="h-6 w-6" />
          </span>
          <span className="emergency-strip-title text-base font-bold leading-snug">জরুরি কল</span>
          <span className="emergency-strip-sub text-sm leading-snug">১ ট্যাপে কল করুন</span>
        </div>

        {/* 3 — ভ্রমণ মোড */}
        <div className="emergency-strip-col group relative flex min-h-[168px] flex-col items-center gap-2.5 px-4 py-8 text-center">
          <Link
            href="/travel"
            aria-label="ভ্রমণ মোড"
            className="absolute inset-0 z-0"
          />
          <span className="emergency-strip-chip flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
            <IconMegaphone className="h-6 w-6" />
          </span>
          <span className="emergency-strip-title text-base font-bold leading-snug">ভ্রমণ মোড</span>
          <span className="emergency-strip-sub line-clamp-2 text-xs leading-snug">
            গাইড ও নিরাপদ আশ্রয়
          </span>
        </div>

        {/* 4 — সমাধান ট্র্যাকার (inner-box style per user 2026-10-22) */}
        <div className="emergency-strip-col group relative flex min-h-[168px] flex-col items-center gap-2.5 px-4 py-8 text-center">
          <span className="emergency-strip-chip flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
            <IconShield className="h-6 w-6" />
          </span>
          <span className="emergency-strip-title text-base font-bold leading-snug">
            সমাধান ট্র্যাকার
          </span>
          <Link
            href="#resolution-tracker"
            aria-label="সমাধান ট্র্যাকার দেখুন"
            className="flex w-full gap-3 rounded-xl bg-cream p-3 text-left text-sm"
          >
            <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
            <p className="text-ink-soft">
              {latestUpdate ? latestUpdate.note : 'পৌরসভার পদক্ষেপ দেখুন'}
            </p>
          </Link>
          <Link
            href="/report"
            className="text-sm font-bold text-brand"
          >
            পৌরসভাকে ট্যাগ করুন →
          </Link>
        </div>
      </div>
    </section>
  );
}
