'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import { getStoredToken, useMember } from '@/lib/member';
import type { AmarElakaData } from '@/lib/types';
import { IconPin, IconUsers } from '@/components/icons';

interface Stats {
  total: number;
  by_district: { district_id: number; name: string; count: number }[];
}

export default function AmarElakaPage() {
  const { member } = useMember();
  const [data, setData] = useState<AmarElakaData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (member === undefined) return;
    (async () => {
      try {
        if (member) {
          const token = getStoredToken();
          const res = await fetch('/api/members/amar-elaka', {
            headers: token ? { 'x-member-token': token } : {},
            cache: 'no-store',
          });
          if (!res.ok) throw new Error('failed');
          setData(await res.json());
        } else {
          const res = await fetch('/api/members/stats', { cache: 'no-store' });
          setStats(await res.json());
        }
      } catch {
        setFailed(true);
      }
    })();
  }, [member]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 lg:max-w-3xl">
        <h1 className="text-xl font-bold text-ink">আমার এলাকার মানুষ</h1>
        <p className="mt-1 text-sm text-ink-soft">
          নিবন্ধিত সদস্যদের তথ্য থেকে স্বয়ংক্রিয়ভাবে তৈরি। এলাকা = সদস্যের নিজের দেওয়া বর্তমান এলাকা (GPS নয়)।
        </p>

        {member === undefined && <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
        {failed && <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">তথ্য লোড করা যায়নি।</p>}

        {member && data && (
          <>
            <div className="mt-4 rounded-2xl bg-ink p-4 text-white">
              <p className="text-xs text-white/70">আমার এলাকা</p>
              <p className="mt-0.5 font-bold">{data.area_label || '—'}</p>
              <p className="mt-1 text-xs text-white/70">
                আমি এখন: {data.my_current_breadcrumb || '—'}
                {data.i_am_away ? ' (নিজ এলাকার বাইরে)' : ' (নিজ এলাকায়)'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-ink">{data.total}</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">মোট সদস্য</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-emerald-600">{data.at_home}</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">নিজ এলাকায় আছেন</p>
              </div>
              <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                <p className="text-2xl font-bold text-brand">{data.away}</p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">অন্য এলাকায় আছেন</p>
              </div>
            </div>

            {data.near_me.length > 0 && (
              <section className="mt-5">
                <h2 className="mb-2 flex items-center gap-2 font-bold text-ink">
                  <IconPin className="h-5 w-5 text-emerald-600" /> আমার আশেপাশে — একই এলাকায় আছেন
                </h2>
                <div className="space-y-2">
                  {data.near_me.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {p.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink">{p.name}</p>
                        <p className="text-xs text-ink-soft">এখন আছেন: {p.current_breadcrumb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="mt-5">
              <h2 className="mb-2 flex items-center gap-2 font-bold text-ink">
                <IconUsers className="h-5 w-5 text-brand" /> অন্য এলাকায় আছেন
              </h2>
              {data.away_list.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
                  আপনার এলাকার সবাই এখন নিজ এলাকাতেই আছেন।
                </p>
              ) : (
                <div className="space-y-2">
                  {data.away_list.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark font-bold text-ink">
                        {p.name.charAt(0)}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-ink">{p.name}</p>
                        <p className="text-xs text-ink-soft">এখন আছেন: {p.current_breadcrumb}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-ink-soft">
                শুধু যারা "দেখান" চালু রেখেছেন তাদেরই নাম দেখানো হয়। কারো ফোন নম্বর এখানে দেখানো হয় না।
              </p>
            </section>
          </>
        )}

        {member === null && stats && (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl bg-white p-5 text-center shadow-sm">
                <p className="text-3xl font-bold text-ink">{stats.total}</p>
                <p className="mt-1 text-sm font-semibold text-ink-soft">মোট নিবন্ধিত সদস্য</p>
              </div>
            </div>
            {stats.by_district.length > 0 && (
              <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-3 font-bold text-ink">জেলাভিত্তিক সদস্য সংখ্যা</h2>
                <div className="space-y-2">
                  {stats.by_district.map((d) => (
                    <div key={d.district_id} className="flex items-center justify-between rounded-xl bg-cream px-3.5 py-2.5 text-sm">
                      <span className="font-semibold text-ink">{d.name}</span>
                      <span className="font-bold text-ink-soft">{d.count} জন</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            <Link href="/register" className="mt-5 block rounded-2xl bg-brand p-4 text-center font-bold text-white">
              নিবন্ধন করে আপনার এলাকার মানুষ দেখুন →
            </Link>
            <p className="mt-3 text-center text-xs text-ink-soft">
              নিবন্ধন ছাড়া শুধু সার্বিক সংখ্যা দেখা যায় — কারো নাম বা ব্যক্তিগত তথ্য নয়।
            </p>
          </>
        )}
      </main>
      <BottomNav />
    </>
  );
}
