'use client';

import { useCallback, useEffect, useState } from 'react';
import { announceBadges } from '@/lib/badges-client';

/**
 * Phase 15 — স্টার রেটিং ("তথ্য কতটা সঠিক?")। রোড/মোড়ের বিস্তারিত পেজে বসে।
 * প্রথম রেটিংয়ে +১ পয়েন্ট; আবার বদলালে স্টার আপডেট হয়, পয়েন্ট নয়।
 */
export default function StarRating({
  targetType,
  targetId,
}: {
  targetType: 'road' | 'spot';
  targetId: number | string;
}) {
  const [myStars, setMyStars] = useState<number | null>(null);
  const [average, setAverage] = useState<number | null>(null);
  const [count, setCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const meRes = await fetch('/api/members/me');
        if (live) setLoggedIn(meRes.ok);
        const res = await fetch(
          `/api/ratings?target_type=${targetType}&target_id=${encodeURIComponent(String(targetId))}`,
          { cache: 'no-store' }
        );
        if (res.ok && live) {
          const d = await res.json();
          setMyStars(typeof d.myStars === 'number' ? d.myStars : null);
          setAverage(typeof d.average === 'number' ? d.average : null);
          setCount(typeof d.count === 'number' ? d.count : 0);
        }
      } catch {
        /* enhancement — never blocks */
      }
    })();
    return () => {
      live = false;
    };
  }, [targetType, targetId]);

  const rate = useCallback(
    async (stars: number) => {
      if (busy || !loggedIn) return;
      setBusy(true);
      try {
        const res = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_type: targetType, target_id: String(targetId), stars }),
        });
        const d = await res.json().catch(() => ({}));
        if (res.ok) {
          setMyStars(stars);
          setAverage(typeof d.average === 'number' ? d.average : null);
          setCount(typeof d.count === 'number' ? d.count : count);
          announceBadges(d.newBadges);
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, loggedIn, targetType, targetId, count]
  );

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <p className="text-sm font-bold text-ink">তথ্য কতটা সঠিক?</p>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="রেটিং">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={myStars === s}
            aria-label={`${s} স্টার`}
            onClick={() => rate(s)}
            disabled={busy || !loggedIn}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-2xl transition-transform active:scale-110"
          >
            <span aria-hidden className={myStars != null && s <= myStars ? '' : 'opacity-30 grayscale'}>
              ⭐
            </span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        {count > 0 ? (
          <>
            গড় <span className="font-bold text-ink">{average}</span> ⭐ · {count} জনের রেটিং
          </>
        ) : (
          'এখনো কেউ রেটিং দেয়নি'
        )}
        {!loggedIn && <span className="block">রেটিং দিতে লগিন করুন</span>}
      </p>
    </div>
  );
}
