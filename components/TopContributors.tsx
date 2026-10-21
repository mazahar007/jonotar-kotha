'use client';

import { useEffect, useState } from 'react';
import SectionHeader from './SectionHeader';
import { IconStar } from './icons';

interface Leader {
  id: number;
  name: string;
  points: number;
  badges: string[];
}

/**
 * Phase 15 — "শীর্ষ অবদানকারী" রেল সেকশন। /api/leaderboard থেকে পয়েন্ট
 * অনুযায়ী সেরা সদস্যরা (opt-in: শুধু show_on_leaderboard=true)।
 */
export default function TopContributors() {
  const [leaders, setLeaders] = useState<Leader[] | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/leaderboard', { cache: 'no-store' });
        if (res.ok && live) {
          const d = await res.json();
          setLeaders(Array.isArray(d.leaders) ? d.leaders : []);
        }
      } catch {
        if (live) setLeaders([]);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  if (!leaders || leaders.length === 0) return null;

  const medals = ['bg-amber-500', 'bg-white/30', 'bg-orange-600'];
  const bn = ['১', '২', '৩', '৪', '৫'];

  return (
    <section className="rounded-3xl bg-surface border border-white/10 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <SectionHeader
        icon={<IconStar className="h-6 w-6" />}
        tileClassName="bg-amber-500/15 text-amber-400"
        title="শীর্ষ অবদানকারী"
        subtitle="পয়েন্টে এলাকার সেরারা"
      />
      <div className="mt-4 space-y-2">
        {leaders.slice(0, 5).map((l, i) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl bg-cream p-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                medals[i] ?? 'bg-white/20'
              }`}
            >
              {bn[i] ?? i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{l.name}</p>
              {l.badges.length > 0 && (
                <p className="truncate text-xs text-ink-soft">{l.badges[l.badges.length - 1]}</p>
              )}
            </div>
            <span className="shrink-0 text-xs font-bold text-amber-400">{l.points} পয়েন্ট</span>
          </div>
        ))}
      </div>
    </section>
  );
}
