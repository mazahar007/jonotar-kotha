'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { IconX } from '@/components/icons';
import type { AdminComment } from '@/lib/report-comments';

/** Phase 7 — admin comments inbox: recent comments across all reports + delete. */
export default function AdminComments() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/comments', { cache: 'no-store' });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm('এই মন্তব্যটি মুছে ফেলবেন?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
      if (res.ok) await load();
      else alert('মোছা যায়নি');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <section className="mb-4">
      <h2 className="mb-2 text-sm font-bold text-ink">মন্তব্য ইনবক্স</h2>
      {loading && <p className="py-4 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
      {!loading && comments.length === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink-soft">
          কোনো মন্তব্য নেই।
        </p>
      )}
      <div className="grid gap-2 lg:grid-cols-2">
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">
                  {c.display_name}
                  {c.member_id != null && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                      সদস্য
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{c.body}</p>
                <p className="mt-2 text-xs text-ink-soft">
                  <Link href={`/reports/${c.report_id}`} className="font-bold text-brand">
                    {c.report_title}
                  </Link>
                  {' · '}
                  {new Date(c.created_at).toLocaleString('bn-BD', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(c.id)}
                disabled={deleting === c.id}
                aria-label="মন্তব্য মুছুন"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
