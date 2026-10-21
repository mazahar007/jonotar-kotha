'use client';

import Link from 'next/link';
import type { Category, MunicipalityUpdate, Report, Volunteer } from '@/lib/types';
import HomeMemberSections from './HomeMemberSections';
import RoadsExplorer from './RoadsExplorer';
import ReportsSlider from './ReportsSlider';
import SafetyScoreSection from './SafetyScoreSection';
import SectionHeader from './SectionHeader';
import TopContributors from './TopContributors';
import { IconPhone, IconShield, IconStar } from './icons';

export default function HomeFeed({
  categories,
  reports,
  volunteers,
  updates,
}: {
  categories: Category[];
  reports: Report[];
  volunteers: Volunteer[];
  updates: MunicipalityUpdate[];
}) {

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

          {/* Phase 16 — Report feed as a big-card slider (top 10, newest first) */}
          <ReportsSlider categories={categories} reports={reports} />

          {/* Phase 10 — এলাকার সেফটি স্কোর */}
          <SafetyScoreSection />

          {/* Phase 4 — রোডের অবস্থা (এলাকাভিত্তিক লাইভ আপডেট), main column */}
          <RoadsExplorer variant="home" />
        </div>

        {/* Right rail on xl (সমাধান ট্র্যাকার + লিডারবোর্ড + জরুরি নম্বর);
            stacked below the feed on smaller screens, same order as before. */}
        <div className="mt-10 min-w-0 space-y-10 md:mt-14 md:space-y-14 xl:mt-0">
          {/* Resolution tracker (Phase 21d: anchor target of the EmergencyStrip column) */}
          {updates.length > 0 && (
            <section id="resolution-tracker" className="scroll-mt-24 rounded-3xl bg-surface border border-line p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <SectionHeader
                icon={<IconShield className="h-6 w-6" />}
                tileClassName="bg-emerald-500/15 text-emerald-300"
                title="সমাধান ট্র্যাকার"
                subtitle="পৌরসভা কোন রিপোর্টে কী করল"
              />
              <div className="mt-4 space-y-2">
                {updates.slice(0, 3).map((u) => (
                  <div key={u.id} className="flex gap-3 rounded-xl bg-cream p-3 text-sm">
                    <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <p className="text-ink-soft">{u.note}</p>
                  </div>
                ))}
              </div>
              <Link href="/report" className="mt-3 block text-center text-sm font-bold text-brand">
                পৌরসভাকে ট্যাগ করুন →
              </Link>
            </section>
          )}

          {/* Volunteer leaderboard */}
          <section className="rounded-3xl bg-surface border border-line p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <SectionHeader
              icon={<IconStar className="h-6 w-6" />}
              tileClassName="bg-amber-500/15 text-amber-400"
              title="স্বেচ্ছাসেবক লিডারবোর্ড"
              subtitle="এলাকার সেরা স্বেচ্ছাসেবকগণ"
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
          <section className="hidden rounded-3xl border border-line bg-surface p-5 text-ink xl:block">
            <SectionHeader
              icon={<IconPhone className="h-6 w-6" />}
              tileClassName="bg-overlay text-ink"
              title="জরুরি নম্বর"
              subtitle="১ ট্যাপে সরাসরি কল করুন"
            />
            <div className="mt-4 space-y-2 text-sm">
              <a href="tel:999" className="flex items-center justify-between rounded-xl bg-overlay px-3 py-2.5">
                <span>জাতীয় জরুরি সেবা</span>
                <span className="font-bold">৯৯৯</span>
              </a>
              <a href="tel:109" className="flex items-center justify-between rounded-xl bg-overlay px-3 py-2.5">
                <span>নারী নির্যাতন প্রতিরোধ</span>
                <span className="font-bold">১০৯</span>
              </a>
              <a href="tel:333" className="flex items-center justify-between rounded-xl bg-overlay px-3 py-2.5">
                <span>সরকারি তথ্য ও সেবা</span>
                <span className="font-bold">৩৩৩</span>
              </a>
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
