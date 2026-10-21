'use client';

import { useMemo, useState } from 'react';
import type { Category, Report } from '@/lib/types';
import ReportCard from './ReportCard';

/** Phase 16 — /reports page body: ALL reports (newest first) + working category filters. */
export default function ReportsGrid({
  categories,
  reports,
}: {
  categories: Category[];
  reports: Report[];
}) {
  const [active, setActive] = useState('সব');

  const items = useMemo(() => {
    const filtered = active === 'সব' ? reports : reports.filter((r) => r.category === active);
    return [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [active, reports]);

  return (
    <div className="space-y-4">
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
        <p className="rounded-2xl bg-surface border border-white/10 p-6 text-center text-sm text-ink-soft">
          এই ক্যাটাগরিতে এখনো কোনো রিপোর্ট নেই।
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  );
}
