'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import SurveyCard from '@/components/SurveyCard';
import { getStoredToken, useMember } from '@/lib/member';
import type { SurveyWithState } from '@/lib/types';

export default function SurveysPage() {
  const { member } = useMember();
  const [surveys, setSurveys] = useState<SurveyWithState[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = getStoredToken();
        const res = await fetch('/api/surveys', {
          headers: token ? { 'x-member-token': token } : {},
          cache: 'no-store',
        });
        const data = await res.json();
        setSurveys(Array.isArray(data) ? data : []);
      } catch {
        setSurveys([]);
      }
    })();
  }, [member]);

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6 lg:max-w-3xl">
        <h1 className="text-xl font-bold text-ink">এলাকার জরিপ</h1>
        <p className="mt-1 text-sm text-ink-soft">
          আপনার নিজ এলাকার জরিপে মতামত দিন। প্রতিটি জরিপে একজন সদস্য একবারই ভোট দিতে পারেন।
        </p>

        {member === null && (
          <Link href="/register" className="mt-4 block rounded-2xl bg-ink p-4 text-center text-sm font-bold text-white">
            ভোট দিতে প্রথমে নিবন্ধন করুন →
          </Link>
        )}

        <div className="mt-5 space-y-4">
          {surveys === null && <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
          {surveys !== null && surveys.length === 0 && (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">এখন কোনো সক্রিয় জরিপ নেই।</p>
          )}
          {surveys?.map((s) => (
            <SurveyCard
              key={s.id}
              survey={s}
              isMember={!!member}
              onVoted={(updated) => setSurveys((prev) => prev?.map((x) => (x.id === updated.id ? updated : x)) ?? prev)}
            />
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
