'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, Report } from '@/lib/types';
import CardSlider from './CardSlider';
import ReportCard from './ReportCard';
import SectionHeader from './SectionHeader';
import { IconChevronRight, IconMegaphone } from './icons';

/**
 * Phase 16 — home "জনতার রিপোর্ট": latest 10 reports (by created_at DESC)
 * as BIG readable cards in a slider + a BIG "আরও দেখুন" button to /reports.
 * Category chips keep working as filters (top 10 of the filtered set).
 */
export default function ReportsSlider({
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
    <section className="space-y-4">
      <SectionHeader
        icon={<IconMegaphone className="h-6 w-6" />}
        tileClassName="bg-red-100 text-brand"
        title="জনতার রিপোর্ট"
        subtitle="এলাকার সমস্যা ও ঘটনার আপডেট"
      />

      {/* Category chips (working filters) */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:-mx-6 lg:px-6">
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
        <p className="rounded-2xl bg-surface border border-white/10 p-6 text-center text-sm text-ink-soft">
          এই ক্যাটাগরিতে এখনো কোনো রিপোর্ট নেই।
        </p>
      ) : (
        <CardSlider
          items={items}
          keyOf={(r) => r.id}
          ariaLabel="জনতার রিপোর্ট স্লাইডার"
          renderCard={(r) => <ReportCard report={r} large />}
        />
      )}

      {/* BIG See More → dedicated all-reports page */}
      <Link
        href="/reports"
        className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl btn-gradient text-lg font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition hover:bg-white/10"
      >
        আরও দেখুন
        <IconChevronRight className="h-5 w-5" />
      </Link>
    </section>
  );
}
