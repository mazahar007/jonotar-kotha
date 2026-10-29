'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Road } from '@/lib/types';
import { bnNum } from '@/lib/time';
import { IconChevronLeft, IconChevronRight } from './icons';
import RoadCard from './RoadCard';

const pad = (n: number) => bnNum(String(n).padStart(2, '0'));

/** One page per wheel gesture: ignore further wheel events for this long. */
const WHEEL_COOLDOWN_MS = 550;
/** Minimum horizontal travel (px) for a swipe / mouse drag to change page. */
const SWIPE_PX = 50;

/**
 * Home roads browser (desktop/tablet): exactly `perPage` equal-height cards
 * per page in one box that matches the one-tap post box beside it.
 * Phase 27 (user feedback):
 * - prev/next arrows sit INSIDE the box at its left and right edges,
 *   vertically centred on the cards (cards get side gutters so the arrows
 *   never cover text); counter + segmented progress stay at the bottom.
 * - finger swipe and mouse click-drag change page (vertical scrolling of
 *   the page still works — touch-action: pan-y).
 * - mouse wheel / trackpad scroll over the box moves left/right, one page
 *   per gesture; at the first/last page the wheel scrolls the page as usual.
 */
export default function RoadPager({ roads, perPage = 2 }: { roads: Road[]; perPage?: number }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const lastWheel = useRef(0);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const dragged = useRef(false);
  const pages = Math.max(1, Math.ceil(roads.length / perPage));

  // New filter / area → first page. Keyed on the road ids, not the array
  // identity: the parent rebuilds the array on unrelated re-renders.
  const idsKey = roads.map((r) => r.id).join(',');
  useEffect(() => {
    setPage(0);
  }, [idsKey]);

  const current = Math.min(page, pages - 1);
  const shown = roads.slice(current * perPage, current * perPage + perPage);

  const go = useCallback(
    (p: number) => {
      const target = (p + pages) % pages;
      setDir(p > current ? 1 : -1);
      setPage(target);
    },
    [current, pages]
  );

  // Wheel → page change. Needs a non-passive listener to preventDefault.
  useEffect(() => {
    const el = boxRef.current;
    if (!el || pages < 2) return;
    const onWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 4) return;
      const forward = delta > 0;
      // At the ends, let the page scroll normally instead of trapping it.
      if ((forward && current >= pages - 1) || (!forward && current <= 0)) return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < WHEEL_COOLDOWN_MS) return;
      lastWheel.current = now;
      go(current + (forward ? 1 : -1));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [current, pages, go]);

  const arrowBtn =
    'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-ink shadow-[0_4px_14px_rgba(0,0,0,0.25)] transition hover:bg-overlay-strong active:scale-95';

  return (
    <div
      ref={boxRef}
      className="flex h-full flex-1 flex-col gap-4 rounded-3xl border border-line bg-surface py-4 sm:py-5"
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
      {/* cards + side arrows */}
      <div
        className={`relative flex flex-1 touch-pan-y select-none ${pages > 1 ? 'px-14' : 'px-4 sm:px-5'}`}
        onPointerDown={(e) => {
          if (pages < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
          if ((e.target as HTMLElement).closest('button')) return;
          drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
          dragged.current = false;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
            dragged.current = true;
            go(current + (dx < 0 ? 1 : -1));
          }
        }}
        onPointerCancel={() => (drag.current = null)}
        // A drag that changed the page must not also open the card link.
        onClickCapture={(e) => {
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
        onDragStart={(e) => e.preventDefault()}
      >
        <div key={current} className={`${dir === 1 ? 'spot-in-right' : 'spot-in-left'} grid flex-1 grid-cols-2 gap-4`}>
          {shown.map((r) => (
            <RoadCard key={r.id} road={r} interactive={false} />
          ))}
        </div>

        {pages > 1 && (
          <>
            <button type="button" onClick={() => go(current - 1)} aria-label="আগের পাতা" className={`${arrowBtn} left-2`}>
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(current + 1)} aria-label="পরের পাতা" className={`${arrowBtn} right-2`}>
              <IconChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {pages > 1 && (
        <div className="mx-14 flex items-center gap-4 border-t border-line pt-4">
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
          <span className="hidden shrink-0 text-xs text-ink-soft xl:inline">স্ক্রল বা ড্র্যাগ করুন</span>
        </div>
      )}
    </div>
  );
}
