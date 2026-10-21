'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconAlert } from './icons';

interface Broadcast {
  id: number;
  title: string;
  body: string;
  expires_at: string;
  created_at: string;
}

/** Phase 9 — broadcast detail view. */
export default function BroadcastDetail({ id }: { id: number }) {
  const [b, setB] = useState<Broadcast | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/broadcasts/${id}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) {
          setMissing(true);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) setB(d as Broadcast);
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (missing)
    return (
      <p className="rounded-2xl bg-surface border border-line p-8 text-center text-sm text-ink-soft">
        ঘোষণাটি পাওয়া যায়নি। <Link href="/broadcasts" className="font-bold text-brand">সব ঘোষণা দেখুন</Link>
      </p>
    );
  if (!b) return <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>;

  const active = new Date(b.expires_at).getTime() > Date.now();
  return (
    <div>
      <div className="rounded-3xl bg-gradient-to-l from-red-600 to-red-700 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-overlay-strong">
            <IconAlert className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/75">
              {active ? '📢 সক্রিয় ঘোষণা' : 'মেয়াদ শেষ'}
            </p>
            <h1 className="text-lg font-bold leading-snug">{b.title}</h1>
          </div>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/95">{b.body}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
          <span className="rounded-full bg-overlay-strong px-3 py-1.5">
            প্রকাশ: {new Date(b.created_at).toLocaleString('bn-BD')}
          </span>
          <span className="rounded-full bg-overlay-strong px-3 py-1.5">
            মেয়াদ: {new Date(b.expires_at).toLocaleString('bn-BD')}
          </span>
        </div>
      </div>
      <Link
        href="/broadcasts"
        className="mt-4 flex min-h-11 items-center justify-center rounded-2xl bg-surface border border-line py-3 text-sm font-bold text-ink shadow-sm"
      >
        ← সব ঘোষণা
      </Link>
    </div>
  );
}
