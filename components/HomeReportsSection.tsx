'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, Report } from '@/lib/types';
import CardSlider from './CardSlider';
import ReportCard from './ReportCard';
import { IconChevronRight } from './icons';

/**
 * Phase 21ag — home "জনতার রিপোর্ট" as a STANDALONE full-page section,
 * mirroring the survey section's rhythm (user: "এটার জন্য উপরের মত সেকশন
 * করে দাও। পুরো এক পেজ জুড়ে হবে।").
 * - Left-aligned header (badge + text-4xl md:text-5xl headline + subtext),
 *   sizes/colors matched to the survey section.
 * - UNIQUE slider styling: gradient-frame cards with Bengali index numbers
 *   and hover lift; 3 cards visible on desktop.
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
    <section className="space-y-[30px]">
      {/* Left-aligned header — sizes/colors matched to the survey section */}
      <div className="text-left">
        <span className="inline-flex items-center rounded-full bg-violet-500/15 px-3 py-1 text-xs font-bold text-violet-300">
          রিপোর্ট
        </span>
        <h2 className="mt-3 text-4xl font-extrabold leading-tight text-ink md:text-5xl">
          জনতার <span className="text-gradient">রিপোর্ট</span>
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-soft">
          এলাকার সমস্যা ও ঘটনার আপডেট
        </p>
      </div>

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
          cardClass="w-[85%] sm:w-[60%] lg:w-[calc(33.333%-10px)]"
          renderCard={(r, i) => (
            <div className="report-unique-frame h-full">
              <span className="report-unique-num" aria-hidden>
                {BN_DIGITS[i] ?? ''}
              </span>
              <ReportCard report={r} large />
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
    </section>
  );
}
