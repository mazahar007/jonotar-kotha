'use client';

import { useEffect, useState } from 'react';
import type { LocationSelection } from './LocationPicker';
import { GRADE_META } from '@/lib/safety-score';
import { bnNum } from '@/lib/time';
import type { SafetyScoreResponse } from '@/app/api/safety-score/route';

function queryOf(sel: LocationSelection): string {
  const p = new URLSearchParams();
  if (sel.division_id) p.set('division_id', String(sel.division_id));
  if (sel.district_id) p.set('district_id', String(sel.district_id));
  if (sel.upazila_id) p.set('upazila_id', String(sel.upazila_id));
  if (sel.thana_id) p.set('thana_id', String(sel.thana_id));
  if (sel.union_id) p.set('union_id', String(sel.union_id));
  const q = p.toString();
  return q ? `?${q}` : '';
}

/** Phase 10 — mini color-coded safety-score chip for a section header. */
export default function SafetyScoreChip({ area }: { area: LocationSelection }) {
  const [score, setScore] = useState<{ score: number; grade: keyof typeof GRADE_META } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/safety-score${queryOf(area)}`, { cache: 'no-store' });
        const json = (await res.json()) as SafetyScoreResponse;
        if (alive && typeof json.score === 'number') {
          setScore({ score: json.score, grade: json.grade });
        }
      } catch {
        /* hide chip on failure */
      }
    })();
    return () => {
      alive = false;
    };
  }, [area]);

  if (!score) return null;
  const meta = GRADE_META[score.grade];
  return (
    <span
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-black ${
        score.grade === 'safe'
          ? 'bg-emerald-100 text-emerald-800'
          : score.grade === 'caution'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-red-100 text-red-800'
      }`}
      title={`সেফটি স্কোর — ${meta.label}`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.ring }} aria-hidden />
      সেফটি {bnNum(score.score)}
    </span>
  );
}
