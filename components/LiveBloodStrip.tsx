'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconChevronRight, IconDroplet } from '@/components/icons';
import { bnNum, timeAgoBn } from '@/lib/time';
import type { LiveBloodShare } from '@/lib/types';

/** "লাইভ রক্তের প্রয়োজন" strip — renders only while blood shares are active. */
export default function LiveBloodStrip() {
  const [shares, setShares] = useState<LiveBloodShare[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/live-shares?purpose=blood', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data)) setShares(data);
      } catch {
        /* strip simply stays hidden */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  if (shares.length === 0) return null;

  return (
    <section className="mt-4 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-200">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-rose-600" />
        </span>
        <h2 className="font-bold text-rose-900">লাইভ রক্তের প্রয়োজন</h2>
        <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
          {bnNum(shares.length)}টি
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {shares.map((s) => (
          <Link
            key={s.id}
            href={`/live/${s.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm transition active:scale-[0.99]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 text-brand">
              <IconDroplet className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-ink">{s.sharer_name}</span>
              <span className="block text-xs text-ink-soft">{timeAgoBn(s.updated_at)} আপডেট হয়েছে</span>
            </span>
            {s.blood_group && (
              <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white">
                {s.blood_group}
              </span>
            )}
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-bold text-brand">
              লাইভ লোকেশন দেখুন <IconChevronRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
