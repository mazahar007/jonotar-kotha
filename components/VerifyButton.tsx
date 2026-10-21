'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveVoterKey } from '@/lib/voter';
import { announceBadges } from '@/lib/badges-client';
import { VERIFY_BADGE_THRESHOLD } from '@/lib/types';
import { IconCheck } from './icons';

/**
 * Phase 7 — "আমিও দেখেছি" verify toggle button.
 * Counts come from /api/reports/[id]/verify; the public app is login-free,
 * so anonymous voters are keyed by a stable localStorage id (m:<id> when a
 * registered member is logged in).
 */
export default function VerifyButton({
  reportId,
  variant = 'full',
}: {
  reportId: number;
  variant?: 'full' | 'compact';
}) {
  const [count, setCount] = useState<number | null>(null);
  const [voted, setVoted] = useState(false);
  const [memberId, setMemberId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const meRes = await fetch('/api/members/me');
        const me = meRes.ok ? await meRes.json() : null;
        const mid = typeof me?.id === 'number' ? me.id : null;
        if (live) setMemberId(mid);
        const key = encodeURIComponent(resolveVoterKey(mid));
        const res = await fetch(`/api/reports/${reportId}/verify?voter_key=${key}`, {
          cache: 'no-store',
        });
        if (res.ok && live) {
          const d = await res.json();
          setCount(typeof d.count === 'number' ? d.count : 0);
          setVoted(Boolean(d.voted));
        }
      } catch {
        /* stay silent — verify is enhancement, never blocks the page */
      }
    })();
    return () => {
      live = false;
    };
  }, [reportId]);

  const toggle = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voter_key: resolveVoterKey(memberId), member_id: memberId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setVoted(Boolean(d.voted));
        setCount(typeof d.count === 'number' ? d.count : count);
        announceBadges(d.newBadges);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, reportId, memberId, count]);

  const verified = (count ?? 0) >= VERIFY_BADGE_THRESHOLD;
  const label = count == null ? '…' : count;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          disabled={busy}
          aria-pressed={voted}
          className={`flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors ${
            voted ? 'bg-emerald-600 text-white' : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15'
          }`}
        >
          <IconCheck className="h-4 w-4" />
          {label}
        </button>
        {verified && (
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
            যাচাইকৃত
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface border border-white/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={voted}
        className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-base font-bold transition-colors ${
          voted
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15 active:bg-emerald-500/25'
        }`}
      >
        <IconCheck className="h-5 w-5" />
        {voted ? 'যাচাই করেছেন ✓' : 'আমিও দেখেছি'}
      </button>
      <p className="mt-2 text-center text-sm text-ink-soft">
        <span className="font-bold text-ink">{label}</span> জন এই রিপোর্ট যাচাই করেছেন
        {verified && <span className="ml-2 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-300">যাচাইকৃত</span>}
      </p>
    </div>
  );
}
