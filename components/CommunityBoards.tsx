'use client';

import { useEffect, useState } from 'react';
import type { Volunteer } from '@/lib/types';
import LeaderboardCard, { type LeaderRow } from './LeaderboardCard';
import { IconStar, IconUsers } from './icons';

interface Leader {
  id: number;
  name: string;
  points: number;
  badges: string[];
}

/**
 * Phase 23 — both leaderboards in ONE tabbed card so the community section
 * fits a single screen: স্বেচ্ছাসেবক (server data) | শীর্ষ অবদানকারী
 * (/api/leaderboard; opt-in members only — the tab hides when empty).
 */
export default function CommunityBoards({ volunteers }: { volunteers: Volunteer[] }) {
  const [tab, setTab] = useState<'vol' | 'top'>('vol');
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    let live = true;
    fetch('/api/leaderboard', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d && Array.isArray(d.leaders)) setLeaders(d.leaders);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const tabs = [
    { key: 'vol' as const, label: 'স্বেচ্ছাসেবক' },
    ...(leaders.length > 0 ? [{ key: 'top' as const, label: 'শীর্ষ অবদানকারী' }] : []),
  ];

  const volRows: LeaderRow[] = volunteers.slice(0, 5).map((v) => ({ id: v.id, name: v.name, sub: v.role, points: v.points }));
  const topRows: LeaderRow[] = leaders.slice(0, 5).map((l) => ({
    id: l.id,
    name: l.name,
    sub: l.badges.length > 0 ? l.badges[l.badges.length - 1] : undefined,
    points: l.points,
  }));
  const showTop = tab === 'top' && leaders.length > 0;

  return (
    <div>
      {tabs.length > 1 && (
        <div role="tablist" aria-label="লিডারবোর্ড" className="mb-4 inline-flex rounded-2xl border border-line bg-overlay p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`min-h-10 rounded-xl px-4 text-sm font-semibold transition ${
                tab === t.key ? 'btn-gradient' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {showTop ? (
        <LeaderboardCard
          title="শীর্ষ অবদানকারী"
          subtitle="পয়েন্টে এলাকার সেরা সদস্যরা"
          Icon={IconStar}
          tile="bg-violet-500/10 text-violet-300"
          rows={topRows}
        />
      ) : (
        <LeaderboardCard
          title="স্বেচ্ছাসেবক লিডারবোর্ড"
          subtitle="এলাকার সেরা স্বেচ্ছাসেবকগণ"
          Icon={IconUsers}
          tile="bg-amber-500/10 text-amber-400"
          rows={volRows}
        />
      )}
    </div>
  );
}
