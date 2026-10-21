'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getStoredToken, useMember } from '@/lib/member';
import type { AmarElakaData, SurveyWithState } from '@/lib/types';
import SurveyCard from './SurveyCard';
import SectionHeader from './SectionHeader';
import { IconCheck, IconChevronRight, IconUsers } from './icons';

/**
 * Phase 3 home sections: newest active survey (everyone) + an
 * "আমার এলাকার মানুষ" summary card (registered members only).
 * Rendered inside the home feed's main column; fetches are client-side
 * so the server-rendered feed is unchanged.
 */
export default function HomeMemberSections() {
  const { member } = useMember();
  const [survey, setSurvey] = useState<SurveyWithState | null>(null);
  const [elaka, setElaka] = useState<AmarElakaData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getStoredToken();
        const headers: Record<string, string> = token ? { 'x-member-token': token } : {};
        const res = await fetch('/api/surveys', { headers, cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          setSurvey(data.find((s: SurveyWithState) => s.status === 'active') ?? null);
        }
        if (token) {
          const r2 = await fetch('/api/members/amar-elaka', { headers, cache: 'no-store' });
          if (r2.ok) setElaka(await r2.json());
        }
      } catch {
        /* sections are optional — never break the feed */
      }
    })();
  }, [member]);

  return (
    <>
      {member && elaka && (
        <section className="space-y-3">
          <SectionHeader
            icon={<IconUsers className="h-6 w-6" />}
            tileClassName="bg-emerald-500/15 text-emerald-300"
            title="আমার এলাকার মানুষ"
            subtitle="নিজ এলাকার কে কোথায় আছেন"
          />
          <Link
            href="/amar-elaka"
            className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <IconUsers className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-ink">আমার এলাকার মানুষ</span>
              <span className="block text-xs text-ink-soft">
                {elaka.area_label} — মোট {elaka.total} জন সদস্য, {elaka.away} জন অন্য এলাকায় আছেন
              </span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>
        </section>
      )}

      {survey && (
        <section className="space-y-3">
          <SectionHeader
            icon={<IconCheck className="h-6 w-6" />}
            tileClassName="bg-violet-500/15 text-violet-300"
            title="এলাকার জরিপ"
            subtitle="আপনার এলাকার প্রশ্নে মত দিন"
          />
          <SurveyCard
            survey={survey}
            isMember={!!member}
            onVoted={(updated) => setSurvey(updated)}
          />
        </section>
      )}

      {member === null && (
        <section className="space-y-3">
          <SectionHeader
            icon={<IconCheck className="h-6 w-6" />}
            tileClassName="bg-violet-500/15 text-violet-300"
            title="এলাকার জরিপ"
            subtitle="আপনার এলাকার প্রশ্নে মত দিন"
          />
          <Link
            href="/surveys"
            className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
              <IconUsers className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-ink">এলাকার জরিপ</span>
              <span className="block text-xs text-ink-soft">চলমান জরিপ দেখুন — ভোট দিতে নিবন্ধন লাগবে</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>
        </section>
      )}
    </>
  );
}
