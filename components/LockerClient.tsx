'use client';

import { useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import SectionHeader from '@/components/SectionHeader';
import { IconLock, IconShield, IconVideo } from '@/components/icons';
import type { EvidenceItem } from '@/lib/types';

export default function LockerClient({ items }: { items: EvidenceItem[] }) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6 lg:px-6">
        <SectionHeader
          gradient
          as="h1"
          icon={<IconLock className="h-6 w-6" />}
          tileClassName="btn-gradient text-white"
          title="প্রমাণ লকার"
          subtitle="গোপন প্রমাণ নিরাপদে সংরক্ষণ করুন"
          action={
            <span className="mt-1.5 shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
              এনক্রিপ্টেড
            </span>
          }
        />

        <div className="mt-4 rounded-2xl border border-white/10 bg-surface p-4 text-ink">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-white/85">
            <IconShield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            আপনার গোপন ভিডিও/ছবি ৩০ দিন এনক্রিপ্টেড থাকবে, শুধু আপনি ও আইনজীবী দেখতে পারবেন।
          </p>
        </div>

        {!unlocked ? (
          <button
            onClick={() => setUnlocked(true)}
            className="mt-5 w-full rounded-2xl btn-gradient py-4 font-bold text-white shadow-lg shadow-red-200"
          >
            লকার খুলুন
          </button>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {items.length === 0 && (
              <p className="rounded-2xl bg-surface border border-white/10 p-6 text-center text-sm text-ink-soft md:col-span-2">
                লকারে এখনো কোনো প্রমাণ সংরক্ষিত নেই।
              </p>
            )}
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-dark text-ink">
                  <IconVideo className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">{it.title}</p>
                  <p className="text-xs text-ink-soft">
                    {it.expires_at
                      ? `মেয়াদ: ${new Date(it.expires_at).toLocaleDateString('bn-BD')}`
                      : 'মেয়াদহীন'}
                  </p>
                </div>
                {it.encrypted && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    সুরক্ষিত
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        {unlocked && (
          <button
            onClick={() => setUnlocked(false)}
            className="mt-3 w-full rounded-2xl bg-white/10 py-3 text-sm font-bold text-ink"
          >
            লকার বন্ধ করুন
          </button>
        )}

        <Link href="/" className="mt-6 block text-center text-sm font-bold text-brand">
          ← হোমে ফিরুন
        </Link>
      </main>
      <BottomNav />
    </>
  );
}
