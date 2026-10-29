'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, Report } from '@/lib/types';
import ReportSpotlight from './ReportSpotlight';
import SampleSectionHead from './SampleSectionHead';
import { IconChevronRight } from './icons';

/**
 * Home "জনতার রিপোর্ট" — zilaseba reference split header (headline left,
 * subtext + "সব রিপোর্ট" right) + Phase 23 ReportSpotlight slider;
 * category chips filter the top 10.
 */
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
      <div className="space-y-8">
        <SampleSectionHead
          badge="রিপোর্ট"
          color="violet"
          title="জনতার রিপোর্ট"
          gradient="এলাকার সর্বশেষ খবর"
          subtext="এলাকার সমস্যা ও ঘটনার আপডেট — যাচাই করুন, মন্তব্য দিন, সমাধান পর্যন্ত নজর রাখুন।"
          size="page"
          stacked
          split
          action={
            <Link
              href="/reports"
              className="group inline-flex min-h-11 items-center gap-x-1.5 rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-overlay"
            >
              সব রিপোর্ট দেখুন
              <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          }
        />

        {/* Category chips (working filters) */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c.name)}
              aria-pressed={active === c.name}
              className={`flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-semibold transition ${
                active === c.name
                  ? 'btn-gradient text-white'
                  : 'border border-line bg-overlay text-ink-soft hover:border-line-strong hover:text-ink'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {items.length === 0 ? (
          <p className="rounded-3xl border border-line bg-surface p-8 text-center text-sm text-ink-soft">
            এই ক্যাটাগরিতে এখনো কোনো রিপোর্ট নেই।
          </p>
        ) : (
          <ReportSpotlight items={items} />
        )}
      </div>
    </section>
  );
}
