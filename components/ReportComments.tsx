'use client';

import { useCallback, useEffect, useState } from 'react';
import { resolveVoterKey } from '@/lib/voter';
import { COMMENT_MAX_LEN } from '@/lib/report-comments';
import { announceBadges } from '@/lib/badges-client';
import LikeButton from './LikeButton';
import type { ReportComment } from '@/lib/types';
import { IconSend } from './icons';

/**
 * Phase 7 — report comments: list (oldest first) + anonymous comment form.
 * The public app is login-free: the name field is optional and prefilled
 * from the member session when available.
 */
export default function ReportComments({ reportId }: { reportId: number }) {
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [memberId, setMemberId] = useState<number | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, { cache: 'no-store' });
      const data = await res.json().catch(() => []);
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    load();
    (async () => {
      try {
        const meRes = await fetch('/api/members/me');
        if (meRes.ok) {
          const me = await meRes.json();
          if (typeof me?.id === 'number') setMemberId(me.id);
          if (me?.name) setName(me.name);
        }
      } catch {
        /* anonymous is fine */
      }
    })();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (posting || !body.trim()) return;
    setPosting(true);
    setError('');
    try {
      const res = await fetch(`/api/reports/${reportId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: name.trim(),
          body,
          voter_key: resolveVoterKey(memberId),
          member_id: memberId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'মন্তব্য পাঠানো যায়নি');
      } else {
        setBody('');
        announceBadges(data.newBadges);
        await load();
      }
    } catch {
      setError('মন্তব্য পাঠানো যায়নি');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section aria-label="মন্তব্য" className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-lg font-bold text-ink">
        মন্তব্য <span className="text-sm font-semibold text-ink-soft">({comments.length})</span>
      </h2>

      {loading && <p className="py-4 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}

      {!loading && comments.length === 0 && (
        <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-center text-sm text-ink-soft">
          এখনো কোনো মন্তব্য নেই — প্রথম মন্তব্য করুন।
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="rounded-xl bg-cream px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-ink">
                {c.display_name}
                {c.member_id != null && (
                  <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                    সদস্য
                  </span>
                )}
              </p>
              <time className="shrink-0 text-[11px] text-ink-soft">
                {new Date(c.created_at).toLocaleString('bn-BD', {
                  day: 'numeric',
                  month: 'short',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </time>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.body}</p>
            {/* Phase 15 — প্রতিটি মন্তব্যে লাইক */}
            <div className="mt-2">
              <LikeButton targetType="comment" targetId={c.id} />
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-4 border-t border-stone-100 pt-4">
        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="comment-name">
          নাম <span className="font-normal text-ink-soft">(ঐচ্ছিক)</span>
        </label>
        <input
          id="comment-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="আপনার নাম"
          maxLength={60}
          className="mb-3 min-h-[44px] w-full rounded-xl border border-stone-200 px-3 text-sm text-ink outline-none focus:border-brand"
        />
        <label className="mb-1 block text-sm font-semibold text-ink" htmlFor="comment-body">
          মন্তব্য
        </label>
        <textarea
          id="comment-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="এই রিপোর্ট সম্পর্কে আপনার মতামত লিখুন..."
          maxLength={COMMENT_MAX_LEN}
          rows={3}
          required
          className="min-h-[88px] w-full rounded-xl border border-stone-200 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-ink-soft">
            {body.length}/{COMMENT_MAX_LEN}
          </span>
        </div>
        {error && <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={posting || !body.trim()}
          className="mt-2 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-brand px-4 text-base font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          <IconSend className="h-4 w-4" />
          {posting ? 'পাঠানো হচ্ছে...' : 'মন্তব্য পাঠান'}
        </button>
      </form>
    </section>
  );
}
