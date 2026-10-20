'use client';

import { useCallback, useEffect, useState } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import RoadStatusBadge from '@/components/RoadStatusBadge';
import type { Road, RoadDetail } from '@/lib/types';

const inputCls =
  'w-full rounded-xl border border-[#efe3d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-brand';

interface RoadForm {
  name: string;
  from_place: string;
  to_place: string;
  loc: LocationSelection;
}

const EMPTY_FORM: RoadForm = { name: '', from_place: '', to_place: '', loc: EMPTY_LOCATION };

function formOf(r: Road): RoadForm {
  return {
    name: r.name,
    from_place: r.from_place ?? '',
    to_place: r.to_place ?? '',
    loc: {
      division_id: r.division_id,
      district_id: r.district_id,
      upazila_id: r.upazila_id,
      thana_id: r.thana_id,
      union_id: r.union_id,
    },
  };
}

export default function AdminRoads() {
  const [roads, setRoads] = useState<Road[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<RoadForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<RoadDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/roads', { cache: 'no-store' });
      const data = await res.json();
      setRoads(Array.isArray(data) ? data : []);
    } catch {
      setRoads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditingId(null);
    setAdding(true);
    setForm(EMPTY_FORM);
  }

  function openEdit(r: Road) {
    setAdding(false);
    setEditingId(r.id);
    setForm(formOf(r));
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function save() {
    if (!form.name.trim()) {
      alert('রোডের নাম লিখুন');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      from_place: form.from_place.trim() || null,
      to_place: form.to_place.trim() || null,
      division_id: form.loc.division_id,
      district_id: form.loc.district_id,
      upazila_id: form.loc.upazila_id,
      thana_id: form.loc.thana_id,
      union_id: form.loc.union_id,
    };
    const res = await fetch(adding ? '/api/roads' : `/api/roads/${editingId}`, {
      method: adding ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      closeForm();
      load();
    } else {
      alert('সংরক্ষণ করা যায়নি');
    }
  }

  async function remove(id: number) {
    if (!confirm('রোডটি মুছে ফেলবেন? এর সব আপডেটও মুছে যাবে।')) return;
    const res = await fetch(`/api/roads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (openId === id) setOpenId(null);
      load();
    } else alert('মোছা যায়নি');
  }

  async function openUpdates(r: Road) {
    if (openId === r.id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(r.id);
    setDetail(null);
    const res = await fetch(`/api/roads/${r.id}`, { cache: 'no-store' });
    if (res.ok) setDetail(await res.json());
  }

  async function deleteUpdate(roadId: number, updateId: number) {
    if (!confirm('এই আপডেটটি মুছে ফেলবেন?')) return;
    const res = await fetch(`/api/roads/${roadId}/updates/${updateId}`, { method: 'DELETE' });
    if (res.ok) {
      const r = await fetch(`/api/roads/${roadId}`, { cache: 'no-store' });
      if (r.ok) setDetail(await r.json());
      load();
    } else alert('মোছা যায়নি');
  }

  const formBlock = (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-bold text-ink">{adding ? 'নতুন রোড যোগ করুন' : 'রোড এডিট করুন'}</h2>
      <div className="mt-3 space-y-3">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="রোডের নাম (যেমন: ব্রিজ রোড)"
          className={inputCls}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            value={form.from_place}
            onChange={(e) => setForm({ ...form, from_place: e.target.value })}
            placeholder="শুরু (যেমন: গাঙ্গিনাপাড় মোড়)"
            className={inputCls}
          />
          <input
            value={form.to_place}
            onChange={(e) => setForm({ ...form, to_place: e.target.value })}
            placeholder="শেষ (যেমন: ব্রহ্মপুত্র ব্রিজ)"
            className={inputCls}
          />
        </div>
        <div className="rounded-xl bg-cream p-3">
          <p className="mb-2 text-xs font-bold text-ink-soft">রোডের এলাকা</p>
          <LocationPicker value={form.loc} onChange={(loc) => setForm({ ...form, loc })} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-2xl bg-brand py-3 font-bold text-white disabled:opacity-50"
          >
            {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
          </button>
          <button onClick={closeForm} className="rounded-2xl bg-cream-dark px-5 py-3 font-bold text-ink">
            বাতিল
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {adding || editingId !== null ? (
        formBlock
      ) : (
        <button
          onClick={openAdd}
          className="mb-3 w-full rounded-2xl border-2 border-dashed border-[#e0d2bd] py-3 text-sm font-bold text-ink-soft"
        >
          + নতুন রোড যোগ করুন
        </button>
      )}

      {loading && <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}

      <div className="grid gap-2 lg:grid-cols-2">
        {roads.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{r.name}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {[r.from_place, r.to_place].filter(Boolean).join(' → ') || 'রুট দেওয়া হয়নি'}
                </p>
                {(r.union_name || r.upazila_name || r.district_name) && (
                  <p className="mt-0.5 text-xs font-semibold text-ink-soft">
                    {[r.union_name, r.upazila_name, r.district_name].filter(Boolean).join(', ')}
                  </p>
                )}
                <p className="mt-1 text-xs text-ink-soft">
                  {r.update_count}টি আপডেট{r.latest_update ? ` · সর্বশেষ ${r.latest_update.time_ago}` : ''}
                </p>
              </div>
              <RoadStatusBadge status={r.current_status} />
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => openUpdates(r)}
                className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white"
              >
                {openId === r.id ? 'আপডেট লুকান' : 'আপডেটসমূহ'}
              </button>
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

            {openId === r.id && (
              <div className="mt-3 border-t border-[#f3e9da] pt-3">
                {!detail ? (
                  <p className="text-sm text-ink-soft">লোড হচ্ছে...</p>
                ) : detail.updates.length === 0 ? (
                  <p className="text-sm text-ink-soft">কোনো আপডেট নেই।</p>
                ) : (
                  <div className="space-y-2">
                    {detail.updates.map((u) => (
                      <div key={u.id} className="flex items-start justify-between gap-2 rounded-xl bg-cream p-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <RoadStatusBadge status={u.status} />
                            <span className="text-xs text-ink-soft">{u.time_ago}</span>
                          </div>
                          <p className="mt-1 text-sm text-ink">{u.note}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">— {u.reporter_name || 'বেনামী'}</p>
                        </div>
                        <button
                          onClick={() => deleteUpdate(r.id, u.id)}
                          className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand"
                        >
                          মুছুন
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && roads.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">কোনো রোড নেই।</p>
      )}
    </div>
  );
}
