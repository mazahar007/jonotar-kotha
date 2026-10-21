'use client';

import { useEffect, useState } from 'react';

/**
 * Phase 15 — গ্লোবাল ব্যাজ টোস্ট। API থেকে newBadges এলে announceBadges()
 * 'jk:badges' ইভেন্ট পাঠায়; এই কম্পোনেন্ট তা শুনে "🏆 নতুন ব্যাজ!" দেখায়।
 * layout.tsx-এ একবার বসে, সব পেজে কাজ করে।
 */
export default function BadgeToast() {
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    const onBadges = (e: Event) => {
      const names = (e as CustomEvent<string[]>).detail ?? [];
      if (names.length === 0) return;
      setBadges((prev) => [...prev, ...names]);
      window.setTimeout(() => {
        setBadges((prev) => prev.filter((b) => !names.includes(b)));
      }, 4500);
    };
    window.addEventListener('jk:badges', onBadges);
    return () => window.removeEventListener('jk:badges', onBadges);
  }, []);

  if (badges.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {badges.map((b, i) => (
        <div
          key={`${b}-${i}`}
          className="flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white shadow-xl"
          role="status"
        >
          <span className="text-lg">🏆</span>
          <span>
            নতুন ব্যাজ! <span className="text-amber-300">{b}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
