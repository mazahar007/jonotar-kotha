'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { IconFlame, IconPin, IconRoute, IconShield, IconStar, IconUsers } from '@/components/icons';
import type { AreaRating, MapIncident } from '@/lib/types';

const kindStyle: Record<string, { bg: string; Icon: (p: { className?: string }) => React.ReactNode; label: string }> = {
  flood: { bg: 'bg-sky-500', Icon: IconPin, label: 'বন্যা স্তর' },
  women_safety: { bg: 'bg-pink-500', Icon: IconShield, label: 'নারী নিরাপত্তা' },
  road_broken: { bg: 'bg-orange-500', Icon: IconFlame, label: 'রাস্তা ভাঙা' },
  shelter: { bg: 'bg-emerald-500', Icon: IconShield, label: 'নিরাপদ আশ্রয়' },
  volunteer: { bg: 'bg-violet-500', Icon: IconUsers, label: 'স্বেচ্ছাসেবক' },
};

export default function MapClient({
  incidents,
  ratings,
}: {
  incidents: MapIncident[];
  ratings: AreaRating[];
}) {
  const [voted, setVoted] = useState<number | null>(null);
  const [selected, setSelected] = useState<MapIncident | null>(null);

  async function vote(id: number) {
    setVoted(id);
    try {
      await fetch('/api/area-ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* offline — vote counted locally only */
    }
  }

  return (
    <>
      <main className="min-h-dvh bg-cream">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold text-ink">লাইভ ম্যাপ</h1>
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
            <span className="blink-dot inline-block h-2 w-2 rounded-full bg-red-600" />
            লাইভ · {incidents.length} সক্রিয় ঘটনা
          </span>
        </div>

        {/* Stylized map (CSS/SVG illustration — no external map tiles) */}
        <div className="relative mx-4 overflow-hidden rounded-3xl bg-[#e8dfd2]" style={{ height: 340 }}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 340" aria-label="এলাকার মানচিত্র">
            <path d="M-20 240 C 80 220, 140 260, 220 240 S 360 200, 430 230 L 430 360 L -20 360 Z" fill="#cfe3f5" opacity="0.9" />
            <path d="M-20 90 C 60 70, 120 110, 200 90 S 340 60, 430 100" stroke="#ffffff" strokeWidth="14" fill="none" opacity="0.9" />
            <path d="M40 -20 C 60 80, 30 180, 70 360" stroke="#ffffff" strokeWidth="10" fill="none" opacity="0.7" />
            <path d="M200 -20 C 190 90, 230 200, 210 360" stroke="#ffffff" strokeWidth="10" fill="none" opacity="0.7" />
            <path d="M300 -20 C 320 100, 290 220, 330 360" stroke="#ffffff" strokeWidth="10" fill="none" opacity="0.7" />
            <path d="M-20 180 C 100 160, 260 200, 430 170" stroke="#a8d5a2" strokeWidth="6" fill="none" strokeDasharray="10 6" />
          </svg>

          {/* Safe route overlay */}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow">
            <IconRoute className="h-4 w-4" /> ১.২ কিমি নিরাপদ রুট
          </div>

          {incidents.map((m, i) => {
            const s = kindStyle[m.kind] ?? kindStyle.shelter;
            const left = 12 + ((i * 53) % 76);
            const top = 18 + ((i * 37) % 62);
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`absolute flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-lg ${s.bg}`}
                style={{ left: `${left}%`, top: `${top}%` }}
                aria-label={m.label}
              >
                <s.Icon className="h-5 w-5" />
              </button>
            );
          })}

          {selected && (
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/95 p-3 text-sm shadow-xl backdrop-blur">
              <p className="font-bold text-ink">{selected.label}</p>
              <p className="text-xs text-ink-soft">{kindStyle[selected.kind]?.label ?? ''}</p>
              <button
                onClick={() => setSelected(null)}
                className="mt-1 text-xs font-bold text-brand"
              >
                বন্ধ করুন
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-2 px-4">
          {Object.entries(kindStyle).map(([k, s]) => (
            <span
              key={k}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-sm"
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-white ${s.bg}`}>
                <s.Icon className="h-3 w-3" />
              </span>
              {s.label}
            </span>
          ))}
        </div>

        {/* Area safety rating */}
        <section className="mx-4 mb-6 mt-5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">এলাকা নিরাপত্তা রেটিং</h2>
          <p className="text-xs text-ink-soft">আপনার এলাকা রেট করুন</p>
          <div className="mt-3 space-y-2">
            {ratings.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">{r.area}</p>
                  <p className="flex items-center gap-1 text-xs text-ink-soft">
                    <IconStar className="h-3.5 w-3.5 text-amber-500" />
                    {Number(r.score).toFixed(1)} · {r.votes + (voted === r.id ? 1 : 0)} ভোট
                  </p>
                </div>
                <button
                  onClick={() => vote(r.id)}
                  disabled={voted === r.id}
                  className="rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                >
                  {voted === r.id ? 'রেট করেছেন ✓' : 'নিরাপদ ভোট দিন'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <BottomNav />
    </>
  );
}
