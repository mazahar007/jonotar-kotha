'use client';

import { useCallback, useEffect, useState } from 'react';
import { LIVE_PURPOSE_LABEL, type LiveShareAdmin, type LiveSharePurpose } from '@/lib/types';

const PURPOSE_BADGE: Record<LiveSharePurpose, string> = {
  danger: 'bg-red-100 text-red-700',
  blood: 'bg-rose-100 text-rose-700',
  help: 'bg-amber-100 text-amber-700',
  general: 'bg-blue-100 text-blue-700',
};

/** Admin SOS-inbox block: live location shares with status + force-stop. */
export default function AdminLiveShares() {
  const [shares, setShares] = useState<LiveShareAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/live-shares', { cache: 'no-store' });
      const data = await res.json();
      setShares(Array.isArray(data) ? data : []);
    } catch {
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function stop(id: string) {
    const res = await fetch(`/api/admin/live-shares/${id}/stop`, { method: 'POST' });
    if (res.ok) load();
    else alert('বন্ধ করা যায়নি');
  }

  return (
    <section className="mb-4">
      <h2 className="mb-2 text-sm font-bold text-ink">লাইভ লোকেশন শেয়ার</h2>
      {loading && <p className="py-4 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
      {!loading && shares.length === 0 && (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-ink-soft">
          কোনো লাইভ শেয়ার নেই।
        </p>
      )}
      <div className="grid gap-2 lg:grid-cols-2">
        {shares.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                  {s.sharer_name}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${PURPOSE_BADGE[s.purpose]}`}>
                    {LIVE_PURPOSE_LABEL[s.purpose]}
                    {s.purpose === 'blood' && s.blood_group ? ` · ${s.blood_group}` : ''}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      s.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : s.expired
                          ? 'bg-cream-dark text-ink-soft'
                          : 'bg-cream-dark text-ink-soft'
                    }`}
                  >
                    {s.is_active ? 'সক্রিয়' : s.expired ? 'মেয়াদ শেষ' : 'বন্ধ'}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  শুরু: {new Date(s.created_at).toLocaleString('bn-BD')}
                  {s.phone ? ` · ফোন: ${s.phone}${s.show_phone ? ' (পাবলিক)' : ''}` : ''}
                </p>
                {s.note && <p className="mt-0.5 text-xs text-ink-soft">{s.note}</p>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <a
                  href={`/live/${s.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-cream-dark px-3 py-1.5 text-xs font-bold text-ink"
                >
                  লাইভ দেখুন
                </a>
                {s.is_active && (
                  <button
                    onClick={() => stop(s.id)}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand"
                  >
                    বন্ধ করুন
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
