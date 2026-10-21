'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { IconChevronLeft, IconChevronRight } from './icons';

const DEFAULT_CARD_CLASS = 'w-[88%] sm:w-[70%] md:w-[calc(50%-6px)] xl:w-[calc(33.333%-8px)]';

interface CardSliderProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  keyOf: (item: T, index: number) => string | number;
  ariaLabel: string;
  /** Responsive width classes for each card wrapper. */
  cardClass?: string;
}

/**
 * Phase 16 — reusable big-card horizontal slider.
 * Native touch swipe + scroll-snap, prev/next arrows (desktop, ≥44px),
 * dot indicators, keyboard arrows. NO autoplay (user taste: subtle motion only).
 */
export default function CardSlider<T>({
  items,
  renderCard,
  keyOf,
  ariaLabel,
  cardClass = DEFAULT_CARD_CLASS,
}: CardSliderProps<T>) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const behavior = useCallback<() => ScrollBehavior>(() => {
    if (typeof window === 'undefined') return 'auto';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }, []);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / Math.max(1, el.clientWidth)));
    setPages(total);
    setPage(Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))));
  }, []);

  // New item set → back to the first slide.
  useEffect(() => {
    const el = trackRef.current;
    if (el) el.scrollTo({ left: 0, behavior: 'auto' });
    // measure after layout settles
    const t = window.setTimeout(update, 50);
    return () => window.clearTimeout(t);
  }, [items.length, update]);

  useEffect(() => {
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const onScroll = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      update();
    });
  }, [update]);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollTo({ left: i * el.clientWidth, behavior: behavior() });
    },
    [behavior]
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const el = trackRef.current;
      if (!el) return;
      el.scrollBy({ left: dir * el.clientWidth, behavior: behavior() });
    },
    [behavior]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      step(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      step(-1);
    }
  };

  if (items.length === 0) return null;

  const arrowCls =
    'absolute top-[36%] z-10 hidden h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink shadow-[0_2px_12px_rgba(0,0,0,0.18)] transition hover:bg-cream-dark disabled:pointer-events-none disabled:opacity-30 md:flex';

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        {items.map((item, i) => (
          <div key={keyOf(item, i)} className={`h-full shrink-0 snap-start ${cardClass}`}>
            {renderCard(item, i)}
          </div>
        ))}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={page === 0}
            aria-label="আগের স্লাইড"
            className={`${arrowCls} left-0`}
          >
            <IconChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            disabled={page >= pages - 1}
            aria-label="পরের স্লাইড"
            className={`${arrowCls} right-0`}
          >
            <IconChevronRight className="h-5 w-5" />
          </button>

          {/* Dot indicators — big tap targets, ≥44px */}
          <div className="mt-2 flex items-center justify-center" aria-label="স্লাইড নির্বাচন">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`স্লাইড ${i + 1}`}
                aria-current={i === page}
                className="flex min-h-11 min-w-9 items-center justify-center"
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    i === page ? 'w-6 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]' : 'w-2 bg-overlay-strong hover:bg-overlay-strong'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
