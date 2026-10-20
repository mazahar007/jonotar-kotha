'use client';

import { useCallback, useEffect, useState } from 'react';

interface AdminMember {
  id: number;
  name: string;
  phone: string;
  is_visible: boolean;
  created_at: string;
  home_breadcrumb: string;
  current_breadcrumb: string;
}

/** Admin-only member list — the only place phone numbers are shown. */
export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/members', { cache: 'no-store' });
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <p className="mb-3 rounded-2xl bg-white p-4 text-sm text-ink-soft shadow-sm">
        মোট নিবন্ধিত সদস্য: <span className="font-bold text-ink">{members.length}</span> জন।
        ফোন নম্বর শুধু অ্যাডমিনের জন্য — সদস্যরা পরস্পরের নম্বর দেখতে পান না।
      </p>
      {loading && <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
      <div className="grid gap-2 lg:grid-cols-2">
        {members.map((m) => (
          <div key={m.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-ink">{m.name}</p>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  m.is_visible ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-ink-soft'
                }`}
              >
                {m.is_visible ? 'দৃশ্যমান' : 'লুকানো'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-soft">ফোন: {m.phone}</p>
            <p className="mt-0.5 text-xs text-ink-soft">নিজ এলাকা: {m.home_breadcrumb || '—'}</p>
            <p className="mt-0.5 text-xs text-ink-soft">বর্তমান এলাকা: {m.current_breadcrumb || '—'}</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              নিবন্ধন: {m.created_at ? new Date(m.created_at).toLocaleDateString('bn-BD') : '—'}
            </p>
          </div>
        ))}
      </div>
      {!loading && members.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">এখনো কোনো সদস্য নিবন্ধন করেননি।</p>
      )}
    </div>
  );
}
