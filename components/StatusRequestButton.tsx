'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMember } from '@/lib/member';
import { bnNum } from '@/lib/time';
import LoginPromptModal from './LoginPromptModal';

/**
 * Phase 18 — "🔔 বর্তমান অবস্থা জানতে চাই" button.
 * Login-gated: a logged-out tap opens the login prompt. One ACTIVE request
 * per member per road — after requesting, the button is disabled with
 * "✅ অনুরোধ পাঠানো হয়েছে". Requesting earns NO points (avoid gaming).
 * When a new update is posted, requests resolve server-side and requesters
 * get an in-app notification; the card refreshes with the new statuses.
 */
export default function StatusRequestButton({
  roadId,
  showPendingCount = false,
  onRequested,
}: {
  roadId: number;
  /** Show "N জন জানতে চেয়েছে" subtly (detail page). */
  showPendingCount?: boolean;
  onRequested?: () => void;
}) {
  const { member } = useMember();
  const [requested, setRequested] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/roads/${roadId}/request`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (typeof data.requested === 'boolean') setRequested(data.requested);
      if (typeof data.pendingCount === 'number') setPendingCount(data.pendingCount);
    } catch {
      /* button stays in default state */
    }
  }, [roadId]);

  useEffect(() => {
    if (member !== undefined) void load();
  }, [member, load]);

  async function ask() {
    if (member === undefined || loading || requested) return;
    if (member === null) {
      setShowLogin(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/roads/${roadId}/request`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setShowLogin(true);
        return;
      }
      if (!res.ok) throw new Error('failed');
      setRequested(true);
      if (typeof data.pendingCount === 'number') setPendingCount(data.pendingCount);
      onRequested?.();
    } catch {
      /* keep the button tappable on failure */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void ask();
        }}
        disabled={requested || member === undefined}
        aria-live="polite"
        className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-4 text-[13px] font-bold transition ${
          requested
            ? 'cursor-default border-emerald-200 bg-emerald-50 text-emerald-700'
            : 'border-[#efe3d3] bg-white text-ink hover:bg-cream disabled:opacity-60'
        }`}
      >
        {loading ? 'পাঠানো হচ্ছে...' : requested ? '✅ অনুরোধ পাঠানো হয়েছে' : '🔔 বর্তমান অবস্থা জানতে চাই'}
      </button>
      {showPendingCount && pendingCount > 0 && (
        <p className="mt-1.5 text-center text-[11px] font-semibold text-ink-soft">
          {bnNum(pendingCount)} জন বর্তমান অবস্থা জানতে চেয়েছে
        </p>
      )}
      <LoginPromptModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        returnTo={`/roads/${roadId}`}
      />
    </div>
  );
}
