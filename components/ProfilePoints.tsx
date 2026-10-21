'use client';

import { useEffect, useState } from 'react';
import SectionHeader from './SectionHeader';
import { IconCheck, IconStar } from './icons';
import { updateMe, type MemberSelfPayload } from '@/lib/member';

interface LedgerRow {
  id: number;
  delta: number;
  reason: string;
  created_at: string;
}

/**
 * Phase 15 — প্রোফাইলে পয়েন্ট সেকশন: মোট পয়েন্ট, ব্যাজ শেলফ, এবং দুটি
 * আলাদা তালিকা — "➕ অর্জিত পয়েন্ট" ও "➖ কাটা পয়েন্ট" (ব্যবহারকারীর
 * নির্দেশমতো আলাদা)। সাথে লিডারবোর্ড opt-in টগল।
 */
export default function ProfilePoints({
  member,
  onMemberChange,
}: {
  member: MemberSelfPayload;
  onMemberChange: (m: MemberSelfPayload) => void;
}) {
  const [points, setPoints] = useState(member.points ?? 0);
  const [badges, setBadges] = useState<string[]>(member.badges ?? []);
  const [earned, setEarned] = useState<LedgerRow[]>([]);
  const [spent, setSpent] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch('/api/members/me/points', { cache: 'no-store' });
        if (res.ok && live) {
          const d = await res.json();
          setPoints(typeof d.points === 'number' ? d.points : 0);
          setBadges(Array.isArray(d.badges) ? d.badges : []);
          const rows: LedgerRow[] = Array.isArray(d.ledger) ? d.ledger : [];
          setEarned(rows.filter((r) => r.delta > 0));
          setSpent(rows.filter((r) => r.delta < 0));
        }
      } catch {
        /* stay silent */
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  async function toggleLeaderboard() {
    try {
      const updated = await updateMe({ show_on_leaderboard: !member.show_on_leaderboard });
      onMemberChange(updated);
    } catch {
      /* ignore */
    }
  }

  const fmtDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <section className="mt-4 rounded-3xl bg-surface border border-line p-5 shadow-sm">
      <SectionHeader
        icon={<IconStar className="h-6 w-6" />}
        tileClassName="bg-amber-500/15 text-amber-400"
        title="আমার পয়েন্ট"
        subtitle="কাজ করুন, পয়েন্ট ও ব্যাজ জিতুন"
      />

      {/* Total + badge shelf */}
      <div className="mt-4 flex items-center gap-4 rounded-2xl bg-cream p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-white">
          {points}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink">মোট {points} পয়েন্ট</p>
          <p className="text-xs text-ink-soft">
            রিপোর্ট, মন্তব্য, লাইক, ভেরিফাই, রেটিং, রোড আপডেট ও জরিপে ভোটে প্রতিটিতে +১
          </p>
        </div>
      </div>

      {badges.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-bold text-ink-soft">আমার ব্যাজ</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {badges.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {/* ➕ অর্জিত পয়েন্ট */}
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <p className="text-sm font-bold text-emerald-300">➕ অর্জিত পয়েন্ট</p>
            {earned.length === 0 ? (
              <p className="mt-2 text-xs text-ink-soft">এখনো কোনো পয়েন্ট অর্জন হয়নি</p>
            ) : (
              <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                {earned.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-ink">
                      {r.reason}
                      <span className="ml-1 text-ink-soft">· {fmtDate(r.created_at)}</span>
                    </span>
                    <span className="shrink-0 font-bold text-emerald-300">+{r.delta}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* ➖ কাটা পয়েন্ট */}
          <div className="rounded-2xl bg-rose-500/10 p-4">
            <p className="text-sm font-bold text-rose-300">➖ কাটা পয়েন্ট</p>
            {spent.length === 0 ? (
              <p className="mt-2 text-xs text-ink-soft">কোনো পয়েন্ট কাটা যায়নি</p>
            ) : (
              <ul className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
                {spent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-ink">
                      {r.reason}
                      <span className="ml-1 text-ink-soft">· {fmtDate(r.created_at)}</span>
                    </span>
                    <span className="shrink-0 font-bold text-rose-300">{r.delta}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Leaderboard opt-in */}
      <button
        onClick={toggleLeaderboard}
        className="mt-4 flex min-h-[44px] w-full items-center gap-3 rounded-2xl bg-cream p-4 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            member.show_on_leaderboard ? 'bg-emerald-500 text-white' : 'bg-surface shadow-inner'
          }`}
        >
          {member.show_on_leaderboard && <IconCheck className="h-4 w-4" />}
        </span>
        <span className="text-sm text-ink">
          <span className="font-semibold">শীর্ষ অবদানকারী তালিকায় আমাকে দেখান</span>
          <span className="block text-xs text-ink-soft">
            চালু থাকলে আপনার নাম, পয়েন্ট ও ব্যাজ সবার তালিকায় দেখা যাবে
          </span>
        </span>
      </button>
    </section>
  );
}
