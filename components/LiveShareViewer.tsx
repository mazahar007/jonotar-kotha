'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconAlert, IconClock, IconDroplet, IconNav, IconPhone, IconUsers } from '@/components/icons';
import { bnNum, timeAgoBn } from '@/lib/time';
import {
  LIVE_PURPOSE_BANNER,
  LIVE_PURPOSE_LABEL,
  type LiveSharePublic,
  type LiveSharePurpose,
} from '@/lib/types';

const BANNER_CLASS: Record<LiveSharePurpose, string> = {
  danger: 'bg-red-500',
  blood: 'bg-rose-600',
  help: 'bg-amber-500',
  general: 'bg-blue-600',
};

const PURPOSE_ICON: Record<LiveSharePurpose, React.ReactNode> = {
  danger: <IconAlert className="h-8 w-8" />,
  blood: <IconDroplet className="h-8 w-8" />,
  help: <IconUsers className="h-8 w-8" />,
  general: <IconNav className="h-8 w-8" />,
};

function updatedLabel(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return 'এইমাত্র';
  if (s < 60) return `${bnNum(s)} সেকেন্ড আগে`;
  return timeAgoBn(iso);
}

export default function LiveShareViewer({ id }: { id: string }) {
  const [data, setData] = useState<LiveSharePublic | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-shares/${id}`, { cache: 'no-store' });
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) setData((await res.json()) as LiveSharePublic);
    } catch {
      /* keep last known state; next poll retries */
    }
  }, [id]);

  useEffect(() => {
    load();
    const poll = setInterval(load, 10_000);
    const ticker = setInterval(() => setTick((x) => x + 1), 5000);
    return () => {
      clearInterval(poll);
      clearInterval(ticker);
    };
  }, [load]);

  if (notFound) {
    return (
      <main className="px-4 py-10">
        <div className="rounded-3xl bg-surface border border-white/10 p-8 text-center shadow-sm">
          <p className="font-bold text-ink">শেয়ারটি পাওয়া যায়নি</p>
          <p className="mt-1 text-sm text-ink-soft">লিংকটি ভুল হতে পারে অথবা শেয়ারটি মুছে ফেলা হয়েছে।</p>
          <Link href="/" className="mt-4 inline-block font-bold text-brand">
            হোমে যান
          </Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-4 py-10">
        <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      </main>
    );
  }

  const active = data.is_active;
  const bbox = `${data.lng - 0.01},${data.lat - 0.01},${data.lng + 0.01},${data.lat + 0.01}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${data.lat},${data.lng}`;

  return (
    <main className="px-4 pb-8 pt-4 lg:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {active ? (
          <section className={`rounded-3xl p-5 text-white shadow-lg ${BANNER_CLASS[data.purpose]}`}>
            <div className="flex items-center gap-3">
              <span className="sos-pulse flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
                {PURPOSE_ICON[data.purpose]}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-snug">
                  {LIVE_PURPOSE_BANNER[data.purpose]}
                  {data.purpose === 'blood' && data.blood_group ? ` · গ্রুপ: ${data.blood_group}` : ''}
                </h1>
                <p className="mt-0.5 text-sm text-white/85">
                  {data.sharer_name} · {LIVE_PURPOSE_LABEL[data.purpose]}
                </p>
              </div>
            </div>
            {data.note && <p className="mt-3 rounded-xl bg-black/20 px-4 py-2.5 text-sm">{data.note}</p>}
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-white/90">
              <IconClock className="h-4 w-4" /> সর্বশেষ আপডেট: {updatedLabel(data.updated_at)}
              <span className="relative ml-1 flex h-2.5 w-2.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-surface opacity-75" />
                <span className="relative h-2.5 w-2.5 rounded-full bg-surface" />
              </span>
            </p>
          </section>
        ) : (
          <section className="rounded-3xl border border-white/10 bg-surface p-5 text-ink shadow-lg">
            <h1 className="text-xl font-bold">এই শেয়ারটি বন্ধ হয়ে গেছে</h1>
            <p className="mt-1 text-sm text-white/80">
              {data.sharer_name} ·{' '}
              {data.expired ? 'শেয়ারের মেয়াদ শেষ হয়ে গেছে' : 'শেয়ারকারী নিজে বন্ধ করেছেন'} · শেষ
              আপডেট: {updatedLabel(data.updated_at)}
            </p>
          </section>
        )}

        <section className="overflow-hidden rounded-3xl bg-surface border border-white/10 shadow-sm">
          <iframe
            key={`${data.lat},${data.lng}`}
            title="লাইভ লোকেশন ম্যাপ"
            src={mapSrc}
            className={`h-[340px] w-full border-0 lg:h-[420px] ${active ? '' : 'opacity-60 grayscale'}`}
            loading="lazy"
          />
          <p className="px-4 py-3 text-xs leading-relaxed text-ink-soft">
            শেয়ারকারীর ব্রাউজার খোলা থাকলে লোকেশন লাইভ আপডেট হয়।
          </p>
        </section>

        <div className="flex gap-2">
          <a
            href={`https://www.google.com/maps?q=${data.lat},${data.lng}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 font-bold text-white"
          >
            <IconNav className="h-5 w-5" /> Google Maps-এ খুলুন
          </a>
          {data.phone && (
            <a
              href={`tel:${data.phone}`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 font-bold text-white"
            >
              <IconPhone className="h-5 w-5" /> কল করুন
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
