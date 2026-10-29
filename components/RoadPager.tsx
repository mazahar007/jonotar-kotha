'use client';

import { useEffect, useState } from 'react';
import type { Road } from '@/lib/types';
import { bnNum } from '@/lib/time';
import { IconChevronLeft, IconChevronRight } from './icons';
import RoadCard from './RoadCard';

const pad = (n: number) => bnNum(String(n).padStart(2, '0'));

/**
 * Phase 24 — desktop roads browser for the home section: exactly `perPage`
 * cards per page in an equal-height grid (no half-visible neighbours, no
 * arrows sitting on card text) + one control bar with page counter,
 * segmented progress and prev/next — same language as ReportSpotlight.
 */
export default function RoadPager({ roads, perPage = 2 }: { roads: Road[]; perPage?: number }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(roads.length / perPage));

  // New filter / area → first page.
  useEffect(() => {
    setPage(0);
  }, [roads]);

  const current = Math.min(page, pages - 1);
  const shown = roads.slice(current * perPage, current * perPage + perPage);
  const go = (p: number) => setPage((p + pages) % pages);

  const arrowBtn =
    'flex h-10 w-10 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition hover:bg-overlay-strong active:scale-95 disabled:pointer-events-none disabled:opacity-30';

  return (
    <div
      className="flex flex-1 flex-col gap-4"
      role="region"
      aria-roledescription="carousel"
      aria-label="রোড ও মোড়ের অবস্থা"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(current + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(current - 1);
        }
      }}
    >
      <div key={current} className="spot-in-right grid flex-1 grid-cols-2 gap-4">
        {shown.map((r) => (
          <RoadCard key={r.id} road={r} interactive={false} />
        ))}
      </div>

      {pages > 1 && (
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-overlay px-4 py-2.5">
          <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
            {pad(current + 1)}
            <span className="font-medium text-ink-soft"> / {pad(pages)}</span>
          </span>
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => go(i)}
                className="group flex h-4 flex-1 items-center"
              >
                <span
                  className={`block h-1 w-full rounded-full transition-all duration-500 ${
                    i === current
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                      : i < current
                        ? 'bg-amber-500/40'
                        : 'bg-overlay-strong group-hover:bg-line-strong'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => go(current - 1)} aria-label="আগের পাতা" className={arrowBtn}>
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label="পরের পাতা" className={arrowBtn}>
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
