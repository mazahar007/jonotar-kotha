'use client';

import Link from 'next/link';
import { useState } from 'react';
import { getStoredToken } from '@/lib/member';
import { announceBadges } from '@/lib/badges-client';
import type { SurveyWithState } from '@/lib/types';
import { bnNum } from '@/lib/time';
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

  /* Phase 22 — zilaseba-reference two-panel layout (its "নিরাপত্তা" section):
     LEFT = question + options as small hairline cards with numbered tiles,
     RIGHT = gradient + noise CTA panel (results | register | vote nudge).
     Voting behavior unchanged. */
  const optionCls =
    'flex w-full items-center gap-3 rounded-2xl border border-line bg-overlay px-4 py-2.5 text-left text-sm font-semibold transition-all duration-300';
  const numCls = (active = false) =>
    `flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
      active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-brand/10 text-brand'
    }`;
  const BN = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const primaryBtn =
    'inline-flex min-h-11 items-center rounded-xl bg-ink px-6 text-sm font-semibold text-[var(--bg)] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl';

  return (
    <section className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
      {/* LEFT — the poll */}
      <div className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-3 py-1 text-violet-300 ring-1 ring-violet-500/20">
            জরিপ · {state.target_label}
          </span>
          {state.status === 'closed' && (
            <span className="inline-flex items-center rounded-full bg-red-500/10 px-3 py-1 text-red-300 ring-1 ring-red-500/20">বন্ধ</span>
          )}
        </div>
        <h3 className="text-xl font-bold leading-snug text-ink">{state.question}</h3>

        {showResults ? (
          <div className="mt-5 space-y-2.5">
            {state.options.map((o, i) => (
              <p key={o} className={`${optionCls} text-ink-soft`}>
                <span className={numCls(state.my_vote === i)}>{BN[i] ?? i + 1}</span>
                <span className="flex-1">{o}</span>
                {state.my_vote === i && <IconCheck className="h-4 w-4 shrink-0 text-emerald-400" />}
              </p>
            ))}
          </div>
        ) : !isMember ? (
          <div className="mt-5 space-y-2.5">
            {state.options.map((o, i) => (
              <p key={o} className={`${optionCls} text-ink-soft`}>
                <span className={numCls()}>{BN[i] ?? i + 1}</span>
                {o}
              </p>
            ))}
          </div>
        ) : state.in_scope === false ? (
          <p className="mt-6 rounded-2xl border border-line bg-overlay px-4 py-3.5 text-sm font-semibold text-ink-soft">
            এই জরিপটি আপনার এলাকার জন্য নয় — এটি {state.target_label}-এর সদস্যদের জন্য।
          </p>
        ) : (
          <div className="mt-5 space-y-2.5">
            {state.options.map((o, i) => (
              <button
                key={o}
                disabled={busy}
                onClick={() => vote(i)}
                className={`${optionCls} text-ink hover:border-line-strong hover:bg-overlay-strong disabled:opacity-50`}
              >
                <span className={numCls()}>{BN[i] ?? i + 1}</span>
                {o}
              </button>
            ))}
            {error && <p className="text-sm font-semibold text-red-400">{error}</p>}
          </div>
        )}
      </div>

      {/* RIGHT — gradient CTA panel (reference "আপনার পণ্য বিক্রয় করুন" card) */}
      <div className="relative overflow-hidden rounded-3xl border border-line">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-brand/10 via-brand-dark/5 to-emerald-500/10" />
        <div aria-hidden className="noise absolute inset-0" />
        <div className="relative flex h-full flex-col items-center justify-center px-6 py-12 text-center sm:px-12">
          {showResults && state.results ? (
            <>
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-overlay-strong text-emerald-400">
                <IconCheck className="h-7 w-7" />
              </span>
              <h4 className="text-2xl font-bold text-ink sm:text-3xl">
                জরিপের <span className="text-gradient">ফলাফল</span>
              </h4>
              <div className="mt-6 w-full max-w-sm space-y-3 text-left">
                {state.results.per_option.map((o, i) => (
                  <div key={i}>
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        {o.option}
                        {state.my_vote === i && <IconCheck className="h-4 w-4 text-emerald-400" />}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-ink-soft">
                        {bnNum(o.pct)}% · {bnNum(o.count)} ভোট
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-overlay-strong">
                      <div
                        className={`h-full rounded-full ${
                          state.my_vote === i ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6]'
                        }`}
                        style={{ width: `${o.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm text-ink-soft">মোট {bnNum(state.results.total)} জন ভোট দিয়েছেন</p>
            </>
          ) : !isMember ? (
            <>
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-overlay-strong text-ink">
                <IconUsers className="h-7 w-7" />
              </span>
              <h4 className="text-2xl font-bold text-ink sm:text-3xl">
                আপনার ভোট,
                <br />
                <span className="text-gradient">আপনার এলাকা</span>
              </h4>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
                নিবন্ধন করে জরিপে অংশ নিন — আপনার মতামতই পরিবর্তন আনে
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <Link href="/register" className={primaryBtn}>
                  নিবন্ধন করুন
                </Link>
                <Link href="/surveys" className="group text-sm font-semibold text-ink-soft transition-colors hover:text-ink">
                  সব জরিপ দেখুন
                  <span className="ml-1 inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </>
          ) : state.in_scope === false ? (
            <>
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-overlay-strong text-brand">
                <IconUsers className="h-7 w-7" />
              </span>
              <h4 className="text-2xl font-bold text-ink sm:text-3xl">
                অন্য জরিপ <span className="text-gradient">দেখুন</span>
              </h4>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
                আপনার এলাকার চলমান জরিপগুলোতে মত দিন
              </p>
              <Link href="/surveys" className={`mt-8 ${primaryBtn}`}>
                সব জরিপ দেখুন
              </Link>
            </>
          ) : (
            <>
              <span className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-overlay-strong text-amber-400">
                <IconCheck className="h-7 w-7" />
              </span>
              <h4 className="text-2xl font-bold text-ink sm:text-3xl">
                একটি অপশন <span className="text-gradient">বেছে নিন</span>
              </h4>
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
                পছন্দের অপশনে ট্যাপ করে ভোট দিন
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
