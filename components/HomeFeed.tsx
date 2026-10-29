'use client';

import Link from 'next/link';
import type { Category, Report, Volunteer } from '@/lib/types';
import type { EmergencyNumber } from '@/lib/settings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { bnNum } from '@/lib/time';
import HomeMemberSections from './HomeMemberSections';
import RoadsExplorer from './RoadsExplorer';
import SafetyScoreSection from './SafetyScoreSection';
import SampleSectionHead from './SampleSectionHead';
import TopContributors from './TopContributors';

export default function HomeFeed({
  categories,
  reports,
  volunteers,
  emergencyNumbers,
}: {
  categories: Category[];
  reports: Report[];
  volunteers: Volunteer[];
  emergencyNumbers?: EmergencyNumber[];
}) {
  const numbers = emergencyNumbers && emergencyNumbers.length > 0
    ? emergencyNumbers
    : DEFAULT_SETTINGS.emergency_numbers;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-10">
      {/* Desktop (xl): main column + right rail. Mobile: single stacked column,
          in the exact original order. One uniform vertical rhythm
          (space-y-10 / md:space-y-14) separates every section so two
          sections can never visually merge. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <div className="min-w-0 space-y-10 md:space-y-14">
          {/* Phase 21d — the old separate emergency-call strip + travel-mode
              teaser were merged into the unified red EmergencyStrip above
              the feed (see app/page.tsx). */}
          {/* Phase 3 — amar-elaka card (members) + newest survey */}
          <HomeMemberSections />

          {/* Phase 21ag — reports moved to a standalone full-page section
              at page level (see app/page.tsx) per user request. */}

          {/* Phase 10 — এলাকার সেফটি স্কোর */}
          <SafetyScoreSection />

          {/* Phase 4 — রোডের অবস্থা (এলাকাভিত্তিক লাইভ আপডেট), main column */}
          <RoadsExplorer variant="home" />
        </div>

        {/* Right rail on xl (লিডারবোর্ড + জরুরি নম্বর);
            stacked below the feed on smaller screens, same order as before.
            Phase 21p: the সমাধান ট্র্যাকার card was removed (now lives in the
            EmergencyStrip above the feed) per user request. */}
        <div className="mt-10 min-w-0 space-y-10 md:mt-14 md:space-y-14 xl:mt-0">
          {/* Volunteer leaderboard */}
          <section className="rounded-2xl bg-surface border border-line p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-colors duration-300 hover:border-white/10">
            <SampleSectionHead
              badge="লিডারবোর্ড"
              color="amber"
              title="স্বেচ্ছাসেবক"
              gradient="লিডারবোর্ড"
              subtext="এলাকার সেরা স্বেচ্ছাসেবকগণ"
            />
            <div className="mt-4 space-y-2">
              {volunteers.slice(0, 3).map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-overlay-strong' : 'bg-orange-600'
                    }`}
                  >
                    {['১', '২', '৩'][i]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{v.name}</p>
                    <p className="text-xs text-ink-soft">{v.role}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400">{v.points} পয়েন্ট</span>
                </div>
              ))}
            </div>
          </section>

          {/* Phase 15 — শীর্ষ অবদানকারী (পয়েন্ট লিডারবোর্ড) */}
          <TopContributors />

          {/* Emergency numbers (existing SOS hotlines, surfaced in the rail on xl only
              so the mobile stack stays exactly as before) */}
          <section className="hidden rounded-2xl border border-line bg-surface p-5 text-ink shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-colors duration-300 hover:border-white/10 xl:block">
            <SampleSectionHead
              badge="জরুরি"
              color="red"
              title="জরুরি"
              gradient="নম্বর"
              subtext="১ ট্যাপে সরাসরি কল করুন"
            />
            <div className="mt-4 space-y-2 text-sm">
              {numbers.map((n) => (
                <a key={n.number} href={`tel:${n.number}`} className="flex items-center justify-between rounded-xl bg-overlay px-3 py-2.5">
                  <span>{n.name}</span>
                  <span className="font-bold">{bnNum(n.number)}</span>
                </a>
              ))}
            </div>
            <Link href="/sos" className="mt-3 block rounded-xl btn-danger py-2.5 text-center text-sm font-bold text-white">
              জরুরি SOS খুলুন
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
