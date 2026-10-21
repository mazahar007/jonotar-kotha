'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABEL, STATUS_OPTIONS, type ReportStatus } from '@/lib/types';
import { IconCheck, IconLogout, IconX } from '@/components/icons';
import AdminBroadcasts from '@/components/AdminBroadcasts';
import AdminComments from '@/components/AdminComments';import AdminLocations from '@/components/AdminLocations';
import AdminLiveShares from '@/components/AdminLiveShares';
import AdminMembers from '@/components/AdminMembers';
import AdminPush from '@/components/AdminPush';
import AdminRoads from '@/components/AdminRoads';
import AdminSurveys from '@/components/AdminSurveys';

type Tab = 'reports' | 'categories' | 'volunteers' | 'donors' | 'sos' | 'evidence' | 'guides' | 'shelters' | 'locations' | 'surveys' | 'members' | 'roads' | 'comments' | 'push' | 'broadcasts';

const TABS: { id: Tab; label: string; endpoint: string }[] = [
  { id: 'reports', label: 'রিপোর্ট', endpoint: '/api/reports' },
  { id: 'categories', label: 'ক্যাটাগরি', endpoint: '/api/categories' },
  { id: 'volunteers', label: 'স্বেচ্ছাসেবক', endpoint: '/api/volunteers' },
  { id: 'donors', label: 'রক্তদাতা', endpoint: '/api/blood-donors' },
  { id: 'sos', label: 'SOS ইনবক্স', endpoint: '/api/sos-alerts' },
  { id: 'evidence', label: 'প্রমাণ', endpoint: '/api/evidence' },
  { id: 'guides', label: 'গাইড', endpoint: '/api/guides' },
  { id: 'shelters', label: 'আশ্রয়', endpoint: '/api/shelters' },
  { id: 'locations', label: 'লোকেশন', endpoint: '' },
  { id: 'surveys', label: 'জরিপ', endpoint: '' },
  { id: 'members', label: 'সদস্য', endpoint: '' },
  { id: 'roads', label: 'রোড', endpoint: '' },
  { id: 'comments', label: 'মন্তব্য', endpoint: '' },
  { id: 'push', label: 'নোটিফিকেশন', endpoint: '' },
  { id: 'broadcasts', label: 'ঘোষণা', endpoint: '' },
];

// editable fields per tab (excluding id)
const FIELDS: Record<Tab, { key: string; label: string; type?: 'text' | 'number' | 'check' }[]> = {
  reports: [
    { key: 'title', label: 'শিরোনাম' },
    { key: 'description', label: 'বর্ণনা' },
    { key: 'category', label: 'ক্যাটাগরি' },
    { key: 'location_name', label: 'এলাকা' },
    { key: 'distance_m', label: 'দূরত্ব (মি)', type: 'number' },
    { key: 'is_anonymous', label: 'বেনামী', type: 'check' },
    { key: 'time_ago', label: 'সময়' },
  ],
  categories: [{ key: 'name', label: 'নাম' }, { key: 'sort_order', label: 'ক্রম', type: 'number' }],
  volunteers: [
    { key: 'name', label: 'নাম' },
    { key: 'role', label: 'ভূমিকা' },
    { key: 'points', label: 'পয়েন্ট', type: 'number' },
  ],
  donors: [
    { key: 'name', label: 'নাম' },
    { key: 'blood_group', label: 'গ্রুপ' },
    { key: 'phone_masked', label: 'ফোন (মাস্কড)' },
    { key: 'distance_m', label: 'দূরত্ব (মি)', type: 'number' },
    { key: 'is_active', label: 'সক্রিয়', type: 'check' },
  ],
  sos: [
    { key: 'alert_type', label: 'ধরন' },
    { key: 'location', label: 'লোকেশন' },
    { key: 'status', label: 'স্ট্যাটাস' },
  ],
  evidence: [
    { key: 'title', label: 'শিরোনাম' },
    { key: 'media_url', label: 'মিডিয়া URL' },
    { key: 'encrypted', label: 'এনক্রিপ্টেড', type: 'check' },
  ],
  guides: [
    { key: 'name', label: 'নাম' },
    { key: 'rating', label: 'রেটিং', type: 'number' },
    { key: 'distance_m', label: 'দূরত্ব (মি)', type: 'number' },
    { key: 'verified', label: 'যাচাইকৃত', type: 'check' },
  ],
  shelters: [
    { key: 'name', label: 'নাম' },
    { key: 'shelter_type', label: 'ধরন' },
    { key: 'distance_m', label: 'দূরত্ব (মি)', type: 'number' },
  ],
  // Managed by dedicated UIs (AdminLocations / AdminSurveys / AdminMembers / AdminRoads), not the generic form.
  locations: [],
  surveys: [],
  members: [],
  roads: [],
  // Managed by a dedicated UI (AdminComments), not the generic form.
  comments: [],
  // Managed by a dedicated UI (AdminPush), not the generic form.
  push: [],
  // Managed by a dedicated UI (AdminBroadcasts), not the generic form.
  broadcasts: [],
};

interface Row {
  id: number;
  [k: string]: unknown;
}

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('reports');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const endpoint = TABS.find((t) => t.id === tab)!.endpoint;

  const load = useCallback(async () => {
    if (!endpoint) {
      // Locations tab uses its own component & data flow.
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    setEditing(null);
    setAdding(false);
    load();
  }, [load]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function openEdit(r: Row) {
    setAdding(false);
    setEditing(r);
    setForm({ ...r });
  }

  function openAdd() {
    setEditing(null);
    setAdding(true);
    const f: Record<string, unknown> = {};
    for (const fld of FIELDS[tab]) f[fld.key] = fld.type === 'check' ? false : fld.type === 'number' ? 0 : '';
    setForm(f);
  }

  async function save() {
    const url = adding ? endpoint : `${endpoint}/${editing!.id}`;
    const method = adding ? 'POST' : 'PATCH';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setEditing(null);
      setAdding(false);
      load();
    } else {
      alert('সংরক্ষণ করা যায়নি');
    }
  }

  async function remove(id: number) {
    if (!confirm('মুছে ফেলবেন?')) return;
    const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert('মোছা যায়নি');
  }

  async function setStatus(id: number, status: ReportStatus) {
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) load();
    else alert('আপডেট করা যায়নি');
  }

  function rowTitle(r: Row): string {
    return String(r.title ?? r.name ?? r.label ?? r.area ?? `#${r.id}`);
  }

  return (
    <main className="min-h-dvh bg-cream">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-surface/95 px-4 py-3 text-ink backdrop-blur">
        <h1 className="font-bold">জনতার কথা — অ্যাডমিন</h1>
        <button onClick={logout} className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
          <IconLogout className="h-4 w-4" /> লগআউট
        </button>
      </header>

      <div className="no-scrollbar sticky top-[52px] z-30 mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto bg-cream px-4 py-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
              tab === t.id ? 'bg-brand text-white' : 'bg-surface text-ink-soft shadow-sm'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 pb-10">
        {tab === 'locations' ? (
          <AdminLocations />
        ) : tab === 'surveys' ? (
          <AdminSurveys />
        ) : tab === 'members' ? (
          <AdminMembers />
        ) : tab === 'roads' ? (
          <AdminRoads />
        ) : tab === 'comments' ? (
          <AdminComments />
        ) : tab === 'push' ? (
          <AdminPush />
        ) : tab === 'broadcasts' ? (
          <AdminBroadcasts />
        ) : (
          <>
        {tab === 'sos' && <AdminLiveShares />}
        <button
          onClick={openAdd}
          className="mb-3 w-full rounded-2xl border-2 border-dashed border-white/15 py-3 text-sm font-bold text-ink-soft"
        >
          + নতুন যোগ করুন
        </button>

        {loading && <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}

        <div className="grid gap-2 lg:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl bg-surface border border-white/10 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{rowTitle(r)}</p>
                  {tab === 'reports' && (
                    <>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {String(r.category ?? '')} · {String(r.location_name ?? '')} ·{' '}
                        {STATUS_LABEL[(r.status as ReportStatus) ?? 'pending']}
                        {r.is_anonymous ? ' · গোপন বাক্স' : ''}
                      </p>
                      {(r.union_name || r.upazila_name || r.district_name) && (
                        <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                          {[r.union_name, r.upazila_name, r.district_name]
                            .filter(Boolean)
                            .map(String)
                            .join(', ')}
                        </p>
                      )}
                    </>
                  )}
                  {tab === 'sos' && (
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {String(r.created_at ? new Date(String(r.created_at)).toLocaleString('bn-BD') : '')}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => openEdit(r)}
                    className="rounded-full bg-cream-dark px-3 py-1.5 text-xs font-bold text-ink"
                  >
                    এডিট
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand"
                  >
                    মুছুন
                  </button>
                </div>
              </div>

              {tab === 'reports' && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStatus(r.id, s.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        r.status === s.value ? 'btn-gradient text-white' : 'bg-cream text-ink-soft'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {!loading && rows.length === 0 && (
          <p className="rounded-2xl bg-surface border border-white/10 p-8 text-center text-sm text-ink-soft">কোনো ডেটা নেই।</p>
        )}
          </>
        )}
      </div>

      {(editing || adding) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-ink">{adding ? 'নতুন যোগ করুন' : 'এডিট করুন'}</h2>
              <button
                onClick={() => {
                  setEditing(null);
                  setAdding(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              {FIELDS[tab].map((f) => (
                <label key={f.key} className="block">
                  <span className="mb-1 block text-xs font-bold text-ink-soft">{f.label}</span>
                  {f.type === 'check' ? (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, [f.key]: !form[f.key] })}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${
                        form[f.key] ? 'bg-emerald-500/15 text-emerald-300' : 'bg-surface text-ink-soft'
                      }`}
                    >
                      {form[f.key] ? <IconCheck className="h-4 w-4" /> : <IconX className="h-4 w-4" />}
                      {form[f.key] ? 'হ্যাঁ' : 'না'}
                    </button>
                  ) : (
                    <input
                      type={f.type === 'number' ? 'number' : 'text'}
                      value={String(form[f.key] ?? '')}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/10 bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand"
                    />
                  )}
                </label>
              ))}
            </div>
            <button
              onClick={save}
              className="mt-5 w-full rounded-2xl btn-gradient py-3.5 font-bold text-white"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
