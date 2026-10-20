'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconCheck, IconX } from './icons';

export interface LocRow {
  id: number;
  name_bn: string;
  name_en: string;
  slug: string;
  sort_order: number;
  [k: string]: unknown;
}

async function fetchList(url: string): Promise<LocRow[]> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function mutate(url: string, method: string, body?: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** One level of the hierarchy (বিভাগ / জেলা / উপজেলা / থানা / ইউনিয়ন) with add/edit/delete. */
function LevelList({
  title,
  endpoint,
  rows,
  parent,
  selectedId,
  onSelect,
  onChanged,
  hint,
}: {
  title: string;
  endpoint: string;
  rows: LocRow[];
  parent?: Record<string, number>;
  selectedId?: number | null;
  onSelect?: (id: number | null) => void;
  onChanged: () => void;
  hint?: string;
}) {
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState({ name_bn: '', name_en: '', slug: '', sort_order: 0 });

  function openNew() {
    setEditing('new');
    setForm({ name_bn: '', name_en: '', slug: '', sort_order: rows.length + 1 });
  }

  function openEdit(r: LocRow) {
    setEditing(r.id);
    setForm({ name_bn: r.name_bn, name_en: r.name_en, slug: r.slug, sort_order: r.sort_order });
  }

  async function save() {
    const body = { ...form, ...(parent ?? {}) };
    const okSave =
      editing === 'new'
        ? await mutate(endpoint, 'POST', body)
        : await mutate(`${endpoint}/${editing}`, 'PATCH', body);
    if (okSave) {
      setEditing(null);
      onChanged();
    } else {
      alert('সংরক্ষণ করা যায়নি (Supabase সেটআপ করা থাকলে আবার চেষ্টা করুন)');
    }
  }

  async function remove(r: LocRow) {
    if (!confirm(`"${r.name_bn}" মুছে ফেলবেন? এর নিচের সব স্তরও মুছে যাবে।`)) return;
    if (await mutate(`${endpoint}/${r.id}`, 'DELETE')) {
      if (selectedId === r.id && onSelect) onSelect(null);
      onChanged();
    } else {
      alert('মোছা যায়নি');
    }
  }

  const inputCls =
    'w-full rounded-xl border border-[#efe3d3] bg-white px-3 py-2 text-sm outline-none focus:border-brand';

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="font-bold text-ink">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-3 space-y-1.5">
        {rows.length === 0 && <p className="py-2 text-sm text-ink-soft">এখনো কিছু যোগ করা হয়নি।</p>}
        {rows.map((r) => (
          <div
            key={r.id}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
              selectedId === r.id ? 'bg-ink text-white' : 'bg-cream'
            }`}
          >
            <button
              onClick={() => onSelect?.(selectedId === r.id ? null : r.id)}
              className="min-w-0 flex-1 text-left"
            >
              <span className="block truncate text-sm font-bold">{r.name_bn}</span>
              <span className={`block text-xs ${selectedId === r.id ? 'text-white/70' : 'text-ink-soft'}`}>
                {r.name_en} · /{r.slug}
              </span>
            </button>
            <button
              onClick={() => openEdit(r)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                selectedId === r.id ? 'bg-white/20 text-white' : 'bg-white text-ink shadow-sm'
              }`}
            >
              এডিট
            </button>
            <button
              onClick={() => remove(r)}
              className="shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand"
            >
              মুছুন
            </button>
          </div>
        ))}
      </div>

      {editing === null ? (
        <button
          onClick={openNew}
          className="mt-3 w-full rounded-xl border-2 border-dashed border-[#e0d2bd] py-2.5 text-sm font-bold text-ink-soft"
        >
          + {title} যোগ করুন
        </button>
      ) : (
        <div className="mt-3 space-y-2 rounded-xl bg-cream p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-ink">{editing === 'new' ? 'নতুন যোগ করুন' : 'এডিট করুন'}</p>
            <button
              onClick={() => setEditing(null)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>
          <input
            value={form.name_bn}
            onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
            placeholder="নাম (বাংলা) *"
            className={inputCls}
          />
          <input
            value={form.name_en}
            onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            placeholder="Name (English)"
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="slug (english-url)"
              className={inputCls}
            />
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              placeholder="ক্রম"
              className={inputCls}
            />
          </div>
          <button
            onClick={save}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-bold text-white"
          >
            <IconCheck className="h-4 w-4" /> সংরক্ষণ করুন
          </button>
        </div>
      )}
    </section>
  );
}

/** Admin → লোকেশন tab: full বিভাগ → জেলা → উপজেলা → থানা/ইউনিয়ন tree management. */
export default function AdminLocations() {
  const [divisions, setDivisions] = useState<LocRow[]>([]);
  const [districts, setDistricts] = useState<LocRow[]>([]);
  const [upazilas, setUpazilas] = useState<LocRow[]>([]);
  const [thanas, setThanas] = useState<LocRow[]>([]);
  const [unions, setUnions] = useState<LocRow[]>([]);

  const [divisionId, setDivisionId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [upazilaId, setUpazilaId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setDivisions(await fetchList('/api/locations/divisions'));
    if (divisionId) {
      setDistricts(await fetchList(`/api/locations/districts?division_id=${divisionId}`));
    } else setDistricts([]);
    if (districtId) {
      setUpazilas(await fetchList(`/api/locations/upazilas?district_id=${districtId}`));
    } else setUpazilas([]);
    if (upazilaId) {
      const [t, u] = await Promise.all([
        fetchList(`/api/locations/thanas?upazila_id=${upazilaId}`),
        fetchList(`/api/locations/unions?upazila_id=${upazilaId}`),
      ]);
      setThanas(t);
      setUnions(u);
    } else {
      setThanas([]);
      setUnions([]);
    }
  }, [divisionId, districtId, upazilaId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function pickDivision(id: number | null) {
    setDivisionId(id);
    setDistrictId(null);
    setUpazilaId(null);
  }
  function pickDistrict(id: number | null) {
    setDistrictId(id);
    setUpazilaId(null);
  }

  return (
    <div className="space-y-4">
      <p className="rounded-2xl bg-white p-4 text-sm text-ink-soft shadow-sm">
        ধাপে ধাপে পুরো বাংলাদেশের এলাকা যোগ করা যাবে: প্রথমে <b>বিভাগ</b> বেছে নিন → তারপর{' '}
        <b>জেলা</b> → <b>উপজেলা</b> → <b>থানা</b> ও <b>ইউনিয়ন</b>। প্রতিটি স্তরে নামের উপর ক্লিক
        করলে পরের স্তর খুলবে। আপাতত ময়মনসিংহ বিভাগের তথ্য দেওয়া আছে।
      </p>

      <LevelList
        title="বিভাগ"
        endpoint="/api/locations/divisions"
        rows={divisions}
        selectedId={divisionId}
        onSelect={pickDivision}
        onChanged={refresh}
      />

      {divisionId && (
        <LevelList
          title="জেলা"
          endpoint="/api/locations/districts"
          rows={districts}
          parent={{ division_id: divisionId }}
          selectedId={districtId}
          onSelect={pickDistrict}
          onChanged={refresh}
        />
      )}

      {districtId && (
        <LevelList
          title="উপজেলা"
          endpoint="/api/locations/upazilas"
          rows={upazilas}
          parent={{ district_id: districtId }}
          selectedId={upazilaId}
          onSelect={setUpazilaId}
          onChanged={refresh}
        />
      )}

      {upazilaId && (
        <div className="grid gap-4 lg:grid-cols-2">
          <LevelList
            title="থানা"
            endpoint="/api/locations/thanas"
            rows={thanas}
            parent={{ upazila_id: upazilaId }}
            onChanged={refresh}
          />
          <LevelList
            title="ইউনিয়ন"
            endpoint="/api/locations/unions"
            rows={unions}
            parent={{ upazila_id: upazilaId }}
            onChanged={refresh}
          />
        </div>
      )}
    </div>
  );
}
