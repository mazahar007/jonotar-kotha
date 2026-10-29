import type { ComponentType } from 'react';
import { bnNum } from '@/lib/time';

export interface LeaderRow {
  id: number | string;
  name: string;
  sub?: string;
  points: number;
}

const MEDALS = ['bg-amber-500 text-white', 'bg-slate-400 text-white', 'bg-orange-600 text-white'];
const BN = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/**
 * Phase 22 — leaderboard in the zilaseba reference's testimonial-card
 * language: hairline card on a faint overlay, icon tile header, rows
 * separated by hairlines, points as a tinted ring pill.
 */
export default function LeaderboardCard({
  title,
  subtitle,
  Icon,
  tile,
  rows,
}: {
  title: string;
  subtitle: string;
  Icon: ComponentType<{ className?: string }>;
  tile: string;
  rows: LeaderRow[];
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line bg-overlay p-6 transition-all duration-300 hover:border-line-strong">
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <p className="text-xs text-ink-soft">{subtitle}</p>
        </div>
      </div>
      <ol>
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 border-t border-line py-3.5">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                MEDALS[i] ?? 'bg-overlay-strong text-ink-soft'
              }`}
            >
              {BN[i] ?? i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{r.name}</p>
              {r.sub ? <p className="truncate text-xs text-ink-soft">{r.sub}</p> : null}
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300 ring-1 ring-inset ring-amber-500/20">
              {bnNum(r.points)} পয়েন্ট
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
