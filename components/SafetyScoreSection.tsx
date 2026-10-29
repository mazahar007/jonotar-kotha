'use client';

import { useEffect, useMemo, useState } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from './LocationPicker';
import SampleSectionHead from './SampleSectionHead';
import { IconX } from './icons';
import {
  BAD_ROAD_PENALTY,
  GRADE_META,
  RESOLVED_BONUS,
  SCORE_DISCLAIMER,
  WEIGHT_MEDIUM,
  WEIGHT_MINOR,
  WEIGHT_SERIOUS,
  type Grade,
} from '@/lib/safety-score';
import { bnNum } from '@/lib/time';
import type { SafetyScoreResponse } from '@/app/api/safety-score/route';

function queryOf(sel: LocationSelection): string {
  const p = new URLSearchParams();
  if (sel.division_id) p.set('division_id', String(sel.division_id));
  if (sel.district_id) p.set('district_id', String(sel.district_id));
  if (sel.upazila_id) p.set('upazila_id', String(sel.upazila_id));
  if (sel.thana_id) p.set('thana_id', String(sel.thana_id));
  if (sel.union_id) p.set('union_id', String(sel.union_id));
  const q = p.toString();
  return q ? `?${q}` : '';
}

/** Colored SVG score ring. */
function ScoreRing({ score, grade }: { score: number; grade: Grade }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const meta = GRADE_META[grade];
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={meta.ring}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * score) / 100}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black ${meta.color}`}>{bnNum(score)}</span>
        <span className="text-[11px] font-bold text-ink-soft">/ ১০০</span>
      </div>
    </div>
  );
}

function TrendLine({ trend }: { trend: SafetyScoreResponse['breakdown']['trend'] }) {
  const map = {
    up: { icon: '▲', text: 'আগের ৯০ দিনের চেয়ে উন্নতি', cls: 'text-emerald-300 bg-emerald-500/10' },
    down: { icon: '▼', text: 'আগের ৯০ দিনের চেয়ে অবনতি', cls: 'text-red-700 bg-red-50' },
    same: { icon: '●', text: 'আগের ৯০ দিনের মতোই', cls: 'text-amber-300 bg-amber-500/10' },
    none: { icon: '—', text: 'তুলনার জন্য পুরনো তথ্য নেই', cls: 'text-ink-soft bg-cream-dark' },
  } as const;
  const m = map[trend];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${m.cls}`}>
      <span aria-hidden>{m.icon}</span> {m.text}
    </span>
  );
}

function BreakdownRow({
  label,
  detail,
  points,
  bonus,
  max,
}: {
  label: string;
  detail: string;
  points: number;
  bonus?: boolean;
  max: number;
}) {
  const width = max > 0 ? Math.round((Math.abs(points) / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-bold text-ink">{label}</span>
        <span className={`font-black ${bonus ? 'text-emerald-300' : 'text-red-700'}`}>
          {points > 0 ? '+' : ''}
          {bnNum(points)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-dark">
          <div
            className={`h-full rounded-full ${bonus ? 'bg-emerald-500' : 'bg-red-400'}`}
            style={{ width: `${width}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-ink-soft">{detail}</span>
      </div>
    </div>
  );
}

/**
 * Phase 10 — home section "এলাকার সেফটি স্কোর": score ring for the selected
 * area (compact LocationPicker), color-coded grade badge, tap → detail modal
 * with breakdown bars, 90-day trend hint, and the required honest disclaimer.
 */
export default function SafetyScoreSection() {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [data, setData] = useState<SafetyScoreResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/safety-score${queryOf(area)}`, { cache: 'no-store' });
        const json = (await res.json()) as SafetyScoreResponse;
        if (alive && typeof json.score === 'number') setData(json);
      } catch {
        /* keep previous */
      }
    })();
    return () => {
      alive = false;
    };
  }, [area]);

  const rows = useMemo(() => {
    if (!data) return [];
    const b = data.breakdown;
    const list = [
      {
        label: 'গুরুতর রিপোর্ট (অপরাধ/দুর্ঘটনা জাতীয়)',
        detail: `${bnNum(b.serious_reports)}টি × −${bnNum(WEIGHT_SERIOUS)}`,
        points: -WEIGHT_SERIOUS * b.serious_reports,
      },
      {
        label: 'মাঝারি রিপোর্ট',
        detail: `${bnNum(b.medium_reports)}টি × −${bnNum(WEIGHT_MEDIUM)}`,
        points: -WEIGHT_MEDIUM * b.medium_reports,
      },
      {
        label: 'সাধারণ রিপোর্ট',
        detail: `${bnNum(b.minor_reports)}টি × −${bnNum(WEIGHT_MINOR)}`,
        points: -WEIGHT_MINOR * b.minor_reports,
      },
      {
        label: 'খারাপ/বন্ধ রোড',
        detail: `${bnNum(b.bad_roads)}টি × −${bnNum(BAD_ROAD_PENALTY)}`,
        points: -BAD_ROAD_PENALTY * b.bad_roads,
      },
      {
        label: 'সমাধান হওয়া যাচাইকৃত রিপোর্ট',
        detail: `${bnNum(b.resolved_verified)}টি × +${bnNum(RESOLVED_BONUS)}`,
        points: RESOLVED_BONUS * b.resolved_verified,
        bonus: true,
      },
    ];
    const max = Math.max(1, ...list.map((r) => Math.abs(r.points)));
    return list.map((r) => ({ ...r, max }));
  }, [data]);

  const grade = data?.grade ?? 'caution';
  const meta = GRADE_META[grade];

  return (
    <section className="space-y-4">
      <SampleSectionHead
        badge="নিরাপত্তা"
        color="emerald"
        title="এলাকার"
        gradient="সেফটি স্কোর"
        subtext="গত ৯০ দিনের রিপোর্ট ও রোডের অবস্থা থেকে আনুমানিক"
      />

      {/* Area picker (reuses home area filter component) */}
      <div className="rounded-2xl bg-surface border border-line p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-2 px-1 text-xs font-bold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      {/* Score card — tap opens the detail modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-11 w-full items-center gap-5 rounded-3xl bg-surface border border-line p-5 text-left shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition active:scale-[0.99]"
        aria-label="সেফটি স্কোরের বিস্তারিত দেখুন"
      >
        {data ? (
          <ScoreRing score={data.score} grade={data.grade} />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-cream-dark text-sm font-bold text-ink-soft">
            লোড হচ্ছে…
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-black ${
              grade === 'safe'
                ? 'bg-emerald-500/15 text-emerald-300'
                : grade === 'caution'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {meta.label}
          </span>
          {data && (
            <>
              <p className="text-sm leading-snug text-ink-soft">
                গত ৯০ দিনে {bnNum(data.breakdown.total_reports)}টি রিপোর্ট ও{' '}
                {bnNum(data.breakdown.roads_checked)}টি রোড/মোড়ের অবস্থা হিসাব করা হয়েছে।
              </p>
              <TrendLine trend={data.breakdown.trend} />
            </>
          )}
          <p className="text-xs font-bold text-brand">বিস্তারিত দেখুন →</p>
          {/* Always-visible honest disclaimer (also repeated inside the detail modal) */}
          <p className="text-[11px] leading-snug text-ink-soft">{SCORE_DISCLAIMER}</p>
        </div>
      </button>

      {/* Detail modal */}
      {open && data && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="সেফটি স্কোরের বিস্তারিত"
        >
          <div
            className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-3xl bg-surface p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-ink">স্কোরের হিসাব</h3>
                <p className="text-xs text-ink-soft">
                  ১০০ থেকে শুরু করে রিপোর্ট ও রোডের অবস্থা অনুযায়ী যোগ-বিয়োগ
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="বন্ধ করুন"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-dark text-ink"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <ScoreRing score={data.score} grade={data.grade} />
              <div className="space-y-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-black ${
                    grade === 'safe'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : grade === 'caution'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {meta.label}
                </span>
                <TrendLine trend={data.breakdown.trend} />
              </div>
            </div>

            <div className="space-y-4">
              {rows.map((r) => (
                <BreakdownRow key={r.label} {...r} />
              ))}
            </div>

            {/* Required honest disclaimer */}
            <p className="rounded-2xl bg-cream p-4 text-sm leading-relaxed text-ink-soft">
              ⚠️ {SCORE_DISCLAIMER} — এটি প্রশাসনিক বা অফিসিয়াল নিরাপত্তা রেটিং
              নয়। বেশি রিপোর্ট মানেই বেশি সমস্যা হতে পারে, আবার সক্রিয়
              রিপোর্টিং-এর ফলাফলও হতে পারে।
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
