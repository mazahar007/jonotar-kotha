import type { ReactNode } from 'react';

/**
 * Phase 21ai — section header in the zilaseba-redesign sample's exact
 * language: small colored badge pill (with ring) + big bold headline with
 * a gradient span + muted subtext. Theme-aware via the app's CSS vars
 * (text-ink / text-ink-soft) and the light-theme pastel overrides in
 * globals.css, so it reads well in both dark and light themes.
 *
 * size="page"  → full-page sections (text-3xl sm:text-5xl, sample-exact)
 * size="feed"  → feed sections     (text-2xl sm:text-4xl, keeps hierarchy)
 */

const BADGE_COLORS = {
  violet: 'bg-violet-500/10 text-violet-300 ring-violet-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-300 ring-amber-500/20',
  red: 'bg-red-500/10 text-red-300 ring-red-500/20',
  teal: 'bg-teal-500/10 text-teal-300 ring-teal-500/20',
} as const;

export type SampleBadgeColor = keyof typeof BADGE_COLORS;

export default function SampleSectionHead({
  badge,
  color = 'violet',
  title,
  gradient,
  subtext,
  size = 'feed',
  align = 'left',
  action,
  stacked = false,
  split = false,
}: {
  badge: string;
  color?: SampleBadgeColor;
  /** Plain first part of the headline. */
  title: string;
  /** Second part, rendered with the brand gradient. */
  gradient: string;
  subtext?: ReactNode;
  size?: 'page' | 'feed';
  align?: 'left' | 'center';
  /** Optional right-side element on the badge row (e.g. "সব দেখুন" link). */
  action?: ReactNode;
  /** Gradient part on its own line (reference: "স্থানীয় সেবা<br>আপনার হাতের কাছে"). */
  stacked?: boolean;
  /** lg+: headline left, subtext + action bottom-aligned on the right. */
  split?: boolean;
}) {
  const centered = align === 'center';
  if (split) {
    return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ${BADGE_COLORS[color]}`}
          >
            {badge}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            {title}
            {stacked ? <br /> : ' '}
            <span className="text-gradient">{gradient}</span>
          </h2>
        </div>
        {(subtext || action) && (
          <div className="flex flex-col gap-3 lg:max-w-md lg:items-end lg:text-right">
            {subtext ? <p className="text-base leading-relaxed text-ink-soft">{subtext}</p> : null}
            {action ? <div>{action}</div> : null}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className={centered ? 'text-center' : 'text-left'}>
      <div className={`flex items-center gap-3 ${centered ? 'justify-center' : 'justify-between'}`}>
        <span
          className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-semibold ring-1 ${BADGE_COLORS[color]}`}
        >
          {badge}
        </span>
        {action && !centered ? <span className="shrink-0">{action}</span> : null}
      </div>
      <h2
        className={`mt-4 font-bold tracking-tight text-ink ${
          size === 'page' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'
        }`}
      >
        {title}
        {stacked ? <br /> : ' '}
        <span className="text-gradient">{gradient}</span>
      </h2>
      {subtext ? (
        <p
          className={`mt-4 text-base leading-relaxed text-ink-soft ${
            centered ? 'mx-auto max-w-lg' : 'max-w-lg'
          }`}
        >
          {subtext}
        </p>
      ) : null}
      {action && centered ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
