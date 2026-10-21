'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getStoredToken } from '@/lib/member';
import { announceBadges } from '@/lib/badges-client';
import type { SurveyWithState } from '@/lib/types';
import { IconCheck, IconUsers } from './icons';

/**
 * One survey card: vote in place when eligible, result bars after voting.
 * `member` = the current member payload (or null when not registered).
 */
export default function SurveyCard({
  survey,
  isMember,
  onVoted,
}: {
  survey: SurveyWithState;
  isMember: boolean;
  onVoted?: (updated: SurveyWithState) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState(survey);

  async function vote(optionIndex: number) {
    setBusy(true);
    setError('');
    try {
      const token = getStoredToken();
      const res = await fetch(`/api/surveys/${state.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-member-token': token } : {}),
        },
        body: JSON.stringify({ option_index: optionIndex }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ভোট দেওয়া যায়নি');
      setState(data as SurveyWithState);
      announceBadges(data.newBadges);
      onVoted?.(data as SurveyWithState);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ভোট দেওয়া যায়নি');
    } finally {
      setBusy(false);
    }
  }

  const showResults = state.results !== null && (state.my_vote !== null || state.status === 'closed');

  return (
    <section className="rounded-2xl bg-surface border border-line p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold text-ink-soft">
        <span className="rounded-full bg-cream-dark px-2.5 py-1">জরিপ · {state.target_label}</span>
        {state.status === 'closed' && <span className="rounded-full bg-red-50 px-2.5 py-1 text-brand">বন্ধ</span>}
      </div>
      <h3 className="text-[15px] font-bold leading-snug text-ink">{state.question}</h3>

      {showResults && state.results ? (
        <div className="mt-3 space-y-2.5">
          {state.results.per_option.map((o, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  {o.option}
                  {state.my_vote === i && <IconCheck className="h-4 w-4 text-emerald-400" />}
                </span>
                <span className="text-xs font-bold text-ink-soft">{o.pct}% · {o.count} ভোট</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark">
                <div
                  className={`h-full rounded-full ${state.my_vote === i ? 'bg-emerald-500' : 'bg-brand'}`}
                  style={{ width: `${o.pct}%` }}
                />
              </div>
            </div>
          ))}
          <p className="pt-1 text-xs text-ink-soft">মোট {state.results.total} জন ভোট দিয়েছেন</p>
        </div>
      ) : !isMember ? (
        <div className="mt-3">
          <div className="space-y-2">
            {state.options.map((o) => (
              <p key={o} className="rounded-xl bg-cream px-3.5 py-2.5 text-sm font-semibold text-ink-soft">
                {o}
              </p>
            ))}
          </div>
          <Link
            href="/register"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl btn-gradient py-3 text-sm font-bold text-white"
          >
            <IconUsers className="h-4 w-4" /> ভোট দিতে নিবন্ধন করুন
          </Link>
        </div>
      ) : state.in_scope === false ? (
        <p className="mt-3 rounded-xl bg-cream px-3.5 py-3 text-sm font-semibold text-ink-soft">
          এই জরিপটি আপনার এলাকার জন্য নয় — এটি {state.target_label}-এর সদস্যদের জন্য।
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {state.options.map((o, i) => (
            <button
              key={o}
              disabled={busy}
              onClick={() => vote(i)}
              className="w-full rounded-xl bg-cream px-3.5 py-3 text-left text-sm font-semibold text-ink transition hover:bg-cream-dark disabled:opacity-50"
            >
              {o}
            </button>
          ))}
          {error && <p className="text-sm font-semibold text-brand">{error}</p>}
        </div>
      )}
    </section>
  );
}
