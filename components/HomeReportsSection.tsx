'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, Report } from '@/lib/types';
import CardSlider from './CardSlider';
import ReportCard from './ReportCard';
import SampleSectionHead from './SampleSectionHead';
import { IconChevronRight } from './icons';

/**
 * Phase 21ai — home "জনতার রিপোর্ট" redesigned in the zilaseba-redesign
 * sample's language (user: "ei site follow koro... এই অংশ নতুন করে
 * ডিজাইন করো"):
 * - Sample section treatment: decorative blurred orb + badge pill with ring
 *   + big bold headline (text-3xl sm:text-5xl) with gradient span + muted
 *   subtext.
 * - BIGGER + TALLER slider (user: "স্লাইড পার্ট আরো বড় এবং লম্বা হবে"):
 *   2 cards visible on desktop (was 3) + ReportCard `tall` variant —
 *   larger cover (h-64 lg:h-72), roomier padding, text-2xl title,
 *   4-line description.
 * - Category chips keep working as filters (top 10 of the filtered set).
 */
const BN_DIGITS = ['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯', '১০'];

export default function HomeReportsSection({
  categories,
  reports,
}: {
  categories: Category[];
  reports: Report[];
}) {
  const [active, setActive] = useState('সব');

  const items = useMemo(() => {
    const filtered = active === 'সব' ? reports : reports.filter((r) => r.category === active);
    return [...filtered]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10);
  }, [active, reports]);

  return (
    <section className="relative w-full">
      {/* Sample-style decorative orb */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-violet-500/10 blur-[120px]"
      />

      <div className="relative space-y-8">
        <SampleSectionHead
          badge="রিপোর্ট"
          color="violet"
          title="জনতার"
          gradient="রিপোর্ট"
          subtext="এলাকার সমস্যা ও ঘটনার আপডেট"
          size="page"
        />

        {/* Category chips (working filters) */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.name)}
              aria-pressed={active === c.name}
              className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                active === c.name ? 'btn-gradient text-white' : 'bg-surface text-ink-soft shadow-sm'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="rounded-2xl bg-surface border border-line p-6 text-center text-sm text-ink-soft">
            এই ক্যাটাগরিতে এখনো কোনো রিপোর্ট নেই।
          </p>
        ) : (
          <CardSlider
            items={items}
            keyOf={(r) => r.id}
            ariaLabel="জনতার রিপোর্ট স্লাইডার"
            cardClass="w-[88%] sm:w-[70%] lg:w-[calc(50%-10px)]"
            renderCard={(r, i) => (
              <div className="report-unique-frame h-full">
                <span className="report-unique-num" aria-hidden>
                  {BN_DIGITS[i] ?? ''}
                </span>
                <ReportCard report={r} tall />
              </div>
            )}
          />
        )}

        {/* BIG See More → dedicated all-reports page */}
        <Link
          href="/reports"
          className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl btn-gradient text-lg font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition hover:bg-overlay"
        >
          আরও দেখুন
          <IconChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </section>
  );
}
