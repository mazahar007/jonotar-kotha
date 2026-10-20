'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { IconDroplet, IconPin, IconSend } from '@/components/icons';
import type { BloodDonor } from '@/lib/types';

export default function BloodClient({ donors }: { donors: BloodDonor[] }) {
  const [requested, setRequested] = useState(false);
  const active = donors.filter((d) => d.is_active);

  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6">
        <h1 className="text-xl font-bold text-ink">রক্তদাতা এখনই</h1>
        <p className="mt-1 text-sm text-ink-soft">
          আপনার আশেপাশে <span className="font-bold text-brand">{active.length} জন</span> দাতা সক্রিয়
        </p>

        {!requested ? (
          <button
            onClick={() => setRequested(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white shadow-lg shadow-red-200"
          >
            <IconSend className="h-5 w-5" /> রক্তের জন্য পাঠান
          </button>
        ) : (
          <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-center">
            <p className="font-bold text-emerald-700">অনুরোধ পাঠানো হয়েছে!</p>
            <p className="mt-1 text-xs text-emerald-600">
              আশেপাশের সক্রিয় দাতারা নোটিফিকেশন পাবেন।
            </p>
          </div>
        )}

        <div className="mt-5 space-y-3">
          {active.map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-brand">
                <IconDroplet className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{d.name}</p>
                <p className="flex items-center gap-2 text-xs text-ink-soft">
                  <span className="font-bold text-brand">{d.blood_group}</span>
                  {d.distance_m != null && (
                    <span className="flex items-center gap-0.5">
                      <IconPin className="h-3.5 w-3.5" /> {d.distance_m}মি
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-soft">{d.phone_masked}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-600" />
                সক্রিয়
              </span>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
