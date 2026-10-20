'use client';

import Link from 'next/link';
import { useState } from 'react';
import { IconPhone, IconPhoneOff, IconUser } from '@/components/icons';

/**
 * ভুয়া কল স্ক্রিন — বিপদ থেকে বের হওয়ার নিরাপদ অজুহাত।
 * "মা কল করছে..." — কেউ বুঝবে না এটি নকল।
 */
export default function FakeCallPage() {
  const [answered, setAnswered] = useState(false);

  return (
    <main className="flex min-h-dvh flex-col bg-[#14100c] px-6 py-10 text-white">
      <div className="flex flex-1 flex-col items-center pt-10 text-center">
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white/15">
          <IconUser className="h-14 w-14 text-white/80" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">{answered ? 'মা — সংযুক্ত' : 'মা কল করছে...'}</h1>
        <p className="mt-1 text-sm text-white/60">মোবাইল · ময়মনসিংহ</p>
        {answered && (
          <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/80">
            এখন আপনি নিরাপদে কথা বলার ভান করে সেখান থেকে বেরিয়ে আসতে পারেন।
          </p>
        )}
      </div>

      {!answered ? (
        <div className="flex items-center justify-between px-4 pb-10">
          <button
            onClick={() => setAnswered(true)}
            aria-label="কেটে দিন"
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-brand"
          >
            <IconPhoneOff className="h-8 w-8" />
            <span className="text-[11px] font-bold">কেটে দিন</span>
          </button>
          <button
            onClick={() => setAnswered(true)}
            aria-label="রিসিভ করুন"
            className="sos-pulse flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-emerald-500"
          >
            <IconPhone className="h-8 w-8" />
            <span className="text-[11px] font-bold">রিসিভ করুন</span>
          </button>
        </div>
      ) : (
        <div className="pb-10">
          <button
            onClick={() => setAnswered(false)}
            className="mx-auto flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-full bg-brand"
            aria-label="কল শেষ করুন"
          >
            <IconPhoneOff className="h-8 w-8" />
          </button>
          <Link href="/sos" className="mt-6 block text-center text-sm text-white/60">
            SOS-এ ফিরুন
          </Link>
        </div>
      )}

      <p className="pb-6 text-center text-xs leading-relaxed text-white/50">
        এই ভুয়া কল স্ক্রিনটি বিপদ থেকে বের হতে সাহায্য করবে।
        <br />
        কেউ বুঝবে না এটি নকল।
      </p>
    </main>
  );
}
