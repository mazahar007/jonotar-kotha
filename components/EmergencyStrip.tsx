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
 * Phase 21u: sample stats-strip style (user: "১ম ছবির স্যাম্পল এর মত করে বানিয়ে দাও")
 * — compact centered cells (tinted icon tile + big bold title + muted subtitle),
 * whole cell is the link; inner boxes + blue link rows removed for the clean
 * sample look. 20px radius + hairline dividers kept.
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

  return (
    <section aria-label="জরুরি সেবা" className="emergency-strip">
      <div className="grid grid-cols-2 gap-[2px] lg:grid-cols-4">
        {/* 1 — জরুরি সতর্কতা (active broadcast, dismissible) */}
        <div className="emergency-strip-col relative">
          <Link
            href={b ? `/broadcasts/${b.id}` : '/broadcasts'}
            aria-label={b ? `সতর্কতা: ${b.title}` : 'জরুরি সতর্কতা'}
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <span className="emergency-strip-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
              <IconAlert className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold leading-snug text-ink">জরুরি সতর্কতা</span>
            <span className="text-sm leading-snug text-ink-soft">এলাকার জরুরি ঘোষণা</span>
          </Link>
          {b && (
            <button
              type="button"
              onClick={() => dismiss(b.id)}
              aria-label="সতর্কতা বন্ধ করুন"
              className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-overlay text-ink-soft transition hover:bg-overlay-strong hover:text-ink"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* 2 — জরুরি কল */}
        <div className="emergency-strip-col">
          <Link
            href="/sos"
            aria-label="জরুরি কল — ১ ট্যাপে কল"
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <span className="emergency-strip-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-400">
              <IconPhone className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold leading-snug text-ink">জরুরি কল</span>
            <span className="text-sm leading-snug text-ink-soft">১ ট্যাপে কল করুন</span>
          </Link>
        </div>

        {/* 3 — ভ্রমণ মোড */}
        <div className="emergency-strip-col">
          <Link
            href="/travel"
            aria-label="ভ্রমণ মোড"
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <span className="emergency-strip-chip flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
              <IconMegaphone className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold leading-snug text-ink">ভ্রমণ মোড</span>
            <span className="text-sm leading-snug text-ink-soft">গাইড ও নিরাপদ আশ্রয়</span>
          </Link>
        </div>

        {/* 4 — সমাধান ট্র্যাকার */}
        <div className="emergency-strip-col">
          <Link
            href="/reports"
            aria-label="সমাধান ট্র্যাকার দেখুন"
            className="flex min-h-[190px] flex-col items-center justify-center gap-2 px-4 py-8 text-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300">
              <IconShield className="h-6 w-6" />
            </span>
            <span className="text-xl font-extrabold leading-snug text-ink">সমাধান ট্র্যাকার</span>
            <span className="text-sm leading-snug text-ink-soft">পৌরসভা কোন রিপোর্টে কী করল</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
