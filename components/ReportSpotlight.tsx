'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Report } from '@/lib/types';
import { bnNum } from '@/lib/time';
import { IconChevronLeft, IconChevronRight, IconClock, IconEye, IconPin } from './icons';
import LikeButton from './LikeButton';
import StatusBadge from './StatusBadge';
import VerifyButton from './VerifyButton';

/** Per-category accent: pill colours + the soft glow behind the featured card. */
const ACCENTS: Record<string, { pill: string; glow: string; bar: string }> = {
  'নিরাপত্তা': { pill: 'bg-red-500/10 text-red-300 ring-red-500/25', glow: 'bg-red-500/20', bar: 'from-red-500 to-orange-400' },
  'নারী নিরাপত্তা': { pill: 'bg-rose-500/10 text-rose-300 ring-rose-500/25', glow: 'bg-rose-500/20', bar: 'from-rose-500 to-pink-400' },
  'সড়ক ও যানজট': { pill: 'bg-amber-500/10 text-amber-300 ring-amber-500/25', glow: 'bg-amber-500/20', bar: 'from-amber-500 to-yellow-400' },
  'দুর্নীতি': { pill: 'bg-violet-500/10 text-violet-300 ring-violet-500/25', glow: 'bg-violet-500/20', bar: 'from-violet-500 to-fuchsia-400' },
  'রক্ত': { pill: 'bg-red-500/10 text-red-300 ring-red-500/25', glow: 'bg-red-500/20', bar: 'from-red-600 to-rose-400' },
  'স্বাস্থ্য': { pill: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25', glow: 'bg-emerald-500/20', bar: 'from-emerald-500 to-teal-400' },
  'দুর্যোগ': { pill: 'bg-orange-500/10 text-amber-300 ring-orange-500/25', glow: 'bg-orange-500/20', bar: 'from-orange-500 to-amber-400' },
  'বন্যা': { pill: 'bg-sky-500/10 text-teal-300 ring-sky-500/25', glow: 'bg-sky-500/20', bar: 'from-sky-500 to-cyan-400' },
};
const DEFAULT_ACCENT = { pill: 'bg-blue-500/10 text-violet-300 ring-blue-500/25', glow: 'bg-blue-500/20', bar: 'from-[#3b82f6] to-[#8b5cf6]' };
const accentOf = (category: string) => ACCENTS[category] ?? DEFAULT_ACCENT;

const pad = (n: number) => bnNum(String(n).padStart(2, '0'));

function distanceLabel(m: number | null): string {
  if (m == null) return '';
  if (m >= 1000) return `${bnNum((m / 1000).toFixed(1))} কিমি`;
  return `${bnNum(m)} মি`;
}

const isVideo = (u: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(u);

/**
 * Phase 23 — home "জনতার রিপোর্ট" spotlight slider (replaces the plain card
 * carousel). One large featured report with a category-tinted glow, plus a
 * clickable "পরের রিপোর্ট" queue (right column on lg, swipeable strip on
 * phones). Swipe / arrow keys / buttons / queue taps all change the slide;
 * a segmented progress bar shows position. No autoplay (subtle motion only).
 */
export default function ReportSpotlight({ items }: { items: Report[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const touchX = useRef<number | null>(null);
  const queueRef = useRef<HTMLDivElement | null>(null);

  // New filter → back to the first report.
  useEffect(() => {
    setIndex(0);
  }, [items]);

  const go = useCallback(
    (next: number) => {
      const n = items.length;
      if (n === 0) return;
      const target = (next + n) % n;
      setDir(target > index || (index === n - 1 && target === 0) ? 1 : -1);
      setIndex(target);
    },
    [index, items.length]
  );

  // Keep the active queue row in view without scrolling the page.
  useEffect(() => {
    const box = queueRef.current;
    const row = box?.querySelector<HTMLElement>(`[data-i="${index}"]`);
    if (!box || !row) return;
    const horizontal = box.scrollWidth > box.clientWidth + 1;
    if (horizontal) box.scrollTo({ left: row.offsetLeft - 16, behavior: 'smooth' });
    else box.scrollTo({ top: row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2, behavior: 'smooth' });
  }, [index]);

  if (items.length === 0) return null;
  const r = items[Math.min(index, items.length - 1)];
  const accent = accentOf(r.category);
  const cover = (r.media_urls ?? []).find((u) => u && !isVideo(u));
  const breadcrumb = [r.union_name, r.upazila_name, r.district_name].filter(Boolean).join(', ');

  const arrowBtn =
    'flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition hover:bg-overlay-strong active:scale-95';

  return (
    <div
      className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-6"
      role="region"
      aria-roledescription="carousel"
      aria-label="জনতার রিপোর্ট"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          go(index - 1);
        }
      }}
    >
      {/* ============ FEATURED ============ */}
      <div
        className="relative overflow-hidden rounded-3xl border border-line bg-surface"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {/* category-tinted glow + giant faint number */}
        <div aria-hidden className={`pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full blur-[90px] transition-colors duration-700 ${accent.glow}`} />
        <span
          aria-hidden
          className="pointer-events-none absolute right-6 top-3 select-none text-[5.5rem] font-black leading-none text-ink opacity-[0.06] sm:right-8 sm:text-[7rem]"
        >
          {pad(index + 1)}
        </span>

        <div key={r.id} className={dir === 1 ? 'spot-in-right' : 'spot-in-left'}>
          {cover && (
            <div className="relative h-48 overflow-hidden sm:h-56">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cover} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
            </div>
          )}

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${accent.pill}`}>
                {r.category}
              </span>
              <StatusBadge status={r.status} />
              {r.is_anonymous && (
                <span className="inline-flex items-center gap-1 rounded-full bg-overlay px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  <IconEye className="h-3.5 w-3.5" />
                  গোপন বাক্স
                </span>
              )}
            </div>

            <h3 className="mt-5 line-clamp-2 max-w-2xl text-2xl font-bold leading-snug text-ink sm:text-[2rem] sm:leading-[1.3]">
              {r.title}
            </h3>
            <p className="mt-3 line-clamp-3 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{r.description}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="flex items-center gap-1.5">
                <IconPin className="h-4 w-4 text-brand" />
                {r.location_name}
                {r.distance_m != null && <span className="opacity-70">· {distanceLabel(r.distance_m)}</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <IconClock className="h-4 w-4" />
                {r.time_ago}
              </span>
              {breadcrumb && <span className="hidden text-xs sm:inline">{breadcrumb}</span>}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="flex items-center gap-2">
                <VerifyButton reportId={r.id} variant="compact" />
                <LikeButton targetType="report" targetId={r.id} />
              </div>
              <Link
                href={`/reports/${r.id}`}
                className="btn-gradient group inline-flex min-h-11 items-center gap-1.5 rounded-xl px-5 text-sm font-semibold"
              >
                বিস্তারিত ও মন্তব্য
                <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* controls: segmented progress + counter + arrows */}
        <div className="relative flex items-center gap-4 border-t border-line px-6 py-4 sm:px-8">
          <span className="shrink-0 text-sm font-bold tabular-nums text-ink">
            {pad(index + 1)}
            <span className="font-medium text-ink-soft"> / {pad(items.length)}</span>
          </span>
          <div className="flex flex-1 gap-1.5" aria-hidden>
            {items.map((it, i) => (
              <span key={it.id} className="h-1 flex-1 overflow-hidden rounded-full bg-overlay-strong">
                <span
                  className={`block h-full rounded-full bg-gradient-to-r transition-all duration-500 ${accent.bar} ${
                    i <= index ? 'w-full' : 'w-0'
                  } ${i < index ? 'opacity-40' : ''}`}
                />
              </span>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => go(index - 1)} aria-label="আগের রিপোর্ট" className={arrowBtn}>
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => go(index + 1)} aria-label="পরের রিপোর্ট" className={arrowBtn}>
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============ QUEUE ============ */}
      <div className="relative min-w-0">
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <p className="text-sm font-semibold text-ink">আরও রিপোর্ট</p>
          <p className="text-xs text-ink-soft">সোয়াইপ করুন →</p>
        </div>
        <div
          ref={queueRef}
          className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 lg:absolute lg:inset-0 lg:mx-0 lg:flex-col lg:gap-2 lg:overflow-y-auto lg:overflow-x-hidden lg:rounded-3xl lg:border lg:border-line lg:bg-overlay lg:p-3"
        >
          <p className="hidden px-3 pb-1 pt-2 text-xs font-semibold tracking-wide text-ink-soft lg:block">
            সব রিপোর্ট · {bnNum(items.length)}টি
          </p>
          {items.map((it, i) => {
            const active = i === index;
            const a = accentOf(it.category);
            return (
              <button
                key={it.id}
                type="button"
                data-i={i}
                onClick={() => go(i)}
                aria-current={active}
                aria-label={`${pad(i + 1)}: ${it.title}`}
                className={`group relative flex w-64 shrink-0 snap-start items-start gap-3 overflow-hidden rounded-2xl border p-3.5 text-left transition-all duration-300 lg:w-full ${
                  active
                    ? 'border-line-strong bg-surface shadow-[0_10px_30px_-12px_rgba(59,130,246,0.35)]'
                    : 'border-line bg-surface lg:border-transparent lg:bg-transparent lg:hover:bg-surface'
                }`}
              >
                {active && <span aria-hidden className={`absolute inset-y-3 left-0 w-1 rounded-r-full bg-gradient-to-b ${a.bar}`} />}
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                    active ? 'btn-gradient' : 'bg-overlay-strong text-ink-soft group-hover:text-ink'
                  }`}
                >
                  {pad(i + 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`line-clamp-2 text-sm font-semibold leading-snug ${active ? 'text-ink' : 'text-ink-soft group-hover:text-ink'}`}>
                    {it.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-xs text-ink-soft">
                    <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-r ${a.bar}`} />
                    {it.category} · {it.time_ago}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
