'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { Category, MunicipalityUpdate, Report, Volunteer } from '@/lib/types';
import ReportCard from './ReportCard';
import HomeMemberSections from './HomeMemberSections';
import RoadsExplorer from './RoadsExplorer';
import { IconChevronRight, IconMegaphone, IconPhone } from './icons';

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
  const [active, setActive] = useState('সব');
  const filtered = useMemo(
    () => (active === 'সব' ? reports : reports.filter((r) => r.category === active)),
    [active, reports]
  );

  return (
    <div className="px-4 pb-6 lg:px-6">
      {/* Desktop (xl): main column + right rail. Mobile: single stacked column,
          in the exact original order. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
        <div className="min-w-0 space-y-5">
          {/* Emergency call strip */}
          <Link
            href="/sos"
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-l from-brand to-brand-dark p-4 text-white shadow-lg shadow-red-200"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
              <IconPhone className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">জরুরি কল — ১ ট্যাপে কল</span>
              <span className="block text-xs text-white/85">
                বিপদে পড়লে সরাসরি কল করুন, আপনার লাইভ লোকেশন স্বয়ংক্রিয়ভাবে যাবে
              </span>
            </span>
            <IconChevronRight className="h-5 w-5" />
          </Link>

          {/* Travel mode teaser */}
          <Link
            href="/travel"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <IconMegaphone className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-ink">
                ভ্রমণ মোড <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-700">চালু</span>
              </span>
              <span className="block text-xs text-ink-soft">আশেপাশে বিশ্বস্ত গাইড ও নিরাপদ আশ্রয় দেখুন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          {/* Phase 3 — amar-elaka card (members) + newest survey */}
          <HomeMemberSections />

          {/* Category chips */}
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:-mx-6 lg:px-6">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.name)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active === c.name ? 'bg-ink text-white' : 'bg-white text-ink-soft shadow-sm'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Report cards — 1 col mobile, 2 col from md up */}
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.length === 0 && (
              <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft md:col-span-2">
                এই ক্যাটাগরিতে এখনো কোনো রিপোর্ট নেই।
              </p>
            )}
            {filtered.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>

          {/* Phase 4 — রোডের অবস্থা (এলাকাভিত্তিক লাইভ আপডেট), main column */}
          <RoadsExplorer variant="home" />
        </div>

        {/* Right rail on xl (সমাধান ট্র্যাকার + লিডারবোর্ড + জরুরি নম্বর);
            stacked below the feed on smaller screens, same order as before. */}
        <div className="mt-5 min-w-0 space-y-5 xl:mt-0">
          {/* Resolution tracker */}
          {updates.length > 0 && (
            <section className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <h2 className="mb-2 font-bold text-ink">সমাধান ট্র্যাকার</h2>
              <div className="space-y-2">
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
          <section className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
            <h2 className="mb-3 font-bold text-ink">স্বেচ্ছাসেবক লিডারবোর্ড</h2>
            <div className="space-y-2">
              {volunteers.slice(0, 3).map((v, i) => (
                <div key={v.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-stone-400' : 'bg-orange-700'
                    }`}
                  >
                    {['১', '২', '৩'][i]}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">{v.name}</p>
                    <p className="text-xs text-ink-soft">{v.role}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-600">{v.points} পয়েন্ট</span>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency numbers (existing SOS hotlines, surfaced in the rail on xl only
              so the mobile stack stays exactly as before) */}
          <section className="hidden rounded-2xl bg-ink p-4 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] xl:block">
            <h2 className="mb-3 font-bold">জরুরি নম্বর</h2>
            <div className="space-y-2 text-sm">
              <a href="tel:999" className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
                <span>জাতীয় জরুরি সেবা</span>
                <span className="font-bold">৯৯৯</span>
              </a>
              <a href="tel:109" className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
                <span>নারী নির্যাতন প্রতিরোধ</span>
                <span className="font-bold">১০৯</span>
              </a>
              <a href="tel:333" className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2.5">
                <span>সরকারি তথ্য ও সেবা</span>
                <span className="font-bold">৩৩৩</span>
              </a>
            </div>
            <Link href="/sos" className="mt-3 block rounded-xl bg-brand py-2.5 text-center text-sm font-bold text-white">
              জরুরি SOS খুলুন
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
