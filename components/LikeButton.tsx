'use client';

import { useCallback, useEffect, useState } from 'react';
import { announceBadges } from '@/lib/badges-client';
import { bnNum } from '@/lib/time';

/**
 * Phase 15 — লাইক বাটন (🤍/❤️ + সংখ্যা)। রিপোর্ট কার্ড, রিপোর্ট বিস্তারিত
 * ও প্রতিটি মন্তব্যে বসে। লগ-ইন করা সদস্যের লাইকে +১ পয়েন্ট (একবারই);
 * লগ-ইন ছাড়া শুধু সংখ্যা দেখা যায়।
 */
export default function LikeButton({
  targetType,
  targetId,
}: {
  targetType: 'report' | 'comment';
  targetId: number | string;
}) {
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const meRes = await fetch('/api/members/me');
        if (live) setLoggedIn(meRes.ok);
        const res = await fetch(
          `/api/likes?target_type=${targetType}&target_id=${encodeURIComponent(String(targetId))}`,
          { cache: 'no-store' }
        );
        if (res.ok && live) {
          const d = await res.json();
          setLiked(Boolean(d.liked));
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

  const toggle = useCallback(async () => {
    if (busy || !loggedIn) return;
    setBusy(true);
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_type: targetType, target_id: String(targetId) }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setLiked(Boolean(d.liked));
        setCount(typeof d.count === 'number' ? d.count : count);
        announceBadges(d.newBadges);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, loggedIn, targetType, targetId, count]);

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || !loggedIn}
      aria-pressed={liked}
      title={loggedIn ? (liked ? 'লাইক তুলে নিন' : 'লাইক দিন') : 'লাইক দিতে লগিন করুন'}
      className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors ${
        liked ? 'bg-rose-600 text-white' : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/15'
      } ${loggedIn ? '' : 'opacity-70'}`}
    >
      <span aria-hidden className="text-base leading-none">
        {liked ? '❤️' : '🤍'}
      </span>
      {count == null ? '…' : bnNum(count)}
    </button>
  );
}
