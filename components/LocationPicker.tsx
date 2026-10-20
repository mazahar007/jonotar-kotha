'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { District, Division, Thana, UnionParishad, Upazila } from '@/lib/types';

export interface LocationSelection {
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
}

export const EMPTY_LOCATION: LocationSelection = {
  division_id: null,
  district_id: null,
  upazila_id: null,
  thana_id: null,
  union_id: null,
};

async function fetchList<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

const selectCls =
  'w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand disabled:opacity-50';

const selectCompactCls =
  'w-full rounded-xl border border-[#efe3d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-brand disabled:opacity-50';

/**
 * Cascading picker: বিভাগ → জেলা → উপজেলা → থানা → ইউনিয়ন.
 * Each level unlocks after its parent is chosen; changing a parent
 * resets all children. Preselects ময়মনসিংহ → ময়মনসিংহ → ময়মনসিংহ সদর.
 * `compact` renders a horizontal filter-bar form (used by রোডের অবস্থা).
 */
export default function LocationPicker({
  value,
  onChange,
  compact = false,
}: {
  value: LocationSelection;
  onChange: (v: LocationSelection) => void;
  compact?: boolean;
}) {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [upazilas, setUpazilas] = useState<Upazila[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [unions, setUnions] = useState<UnionParishad[]>([]);
  const initDone = useRef(false);
  const initialValue = useRef(value);
  const loadedDiv = useRef<number | null>(null);
  const loadedDist = useRef<number | null>(null);
  const loadedUpa = useRef<number | null>(null);

  // Load districts whenever the division changes (not on preselect-only mounts)
  const loadDistricts = useCallback(async (divisionId: number) => {
    loadedDiv.current = divisionId;
    setDistricts(await fetchList<District>(`/api/locations/districts?division_id=${divisionId}`));
  }, []);
  const loadUpazilas = useCallback(async (districtId: number) => {
    loadedDist.current = districtId;
    setUpazilas(await fetchList<Upazila>(`/api/locations/upazilas?district_id=${districtId}`));
  }, []);
  const loadThanasUnions = useCallback(async (upazilaId: number) => {
    loadedUpa.current = upazilaId;
    const [t, u] = await Promise.all([
      fetchList<Thana>(`/api/locations/thanas?upazila_id=${upazilaId}`),
      fetchList<UnionParishad>(`/api/locations/unions?upazila_id=${upazilaId}`),
    ]);
    setThanas(t);
    setUnions(u);
  }, []);

  // Initial load + preselect ময়মনসিংহ বিভাগ → ময়মনসিংহ জেলা → ময়মনসিংহ সদর.
  // When the parent already supplies a value (e.g. profile editing), keep it —
  // the sync effects below load the matching lists instead.
  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    (async () => {
      const divs = await fetchList<Division>('/api/locations/divisions');
      setDivisions(divs);
      if (initialValue.current.division_id) return;
      const div = divs.find((d) => d.slug === 'mymensingh');
      if (!div) return;
      const dists = await fetchList<District>(`/api/locations/districts?division_id=${div.id}`);
      loadedDiv.current = div.id;
      setDistricts(dists);
      const dist = dists.find((d) => d.slug === 'mymensingh');
      if (!dist) {
        onChange({ ...EMPTY_LOCATION, division_id: div.id });
        return;
      }
      const ups = await fetchList<Upazila>(`/api/locations/upazilas?district_id=${dist.id}`);
      loadedDist.current = dist.id;
      setUpazilas(ups);
      const sadar = ups.find((u) => u.slug === 'mymensingh-sadar');
      onChange({
        division_id: div.id,
        district_id: dist.id,
        upazila_id: sadar ? sadar.id : null,
        thana_id: null,
        union_id: null,
      });
      if (sadar) {
        const [t, u] = await Promise.all([
          fetchList<Thana>(`/api/locations/thanas?upazila_id=${sadar.id}`),
          fetchList<UnionParishad>(`/api/locations/unions?upazila_id=${sadar.id}`),
        ]);
        loadedUpa.current = sadar.id;
        setThanas(t);
        setUnions(u);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync child lists when the parent sets the value externally (profile edit etc.)
  useEffect(() => {
    if (value.division_id && loadedDiv.current !== value.division_id) loadDistricts(value.division_id);
  }, [value.division_id, loadDistricts]);
  useEffect(() => {
    if (value.district_id && loadedDist.current !== value.district_id) loadUpazilas(value.district_id);
  }, [value.district_id, loadUpazilas]);
  useEffect(() => {
    if (value.upazila_id && loadedUpa.current !== value.upazila_id) loadThanasUnions(value.upazila_id);
  }, [value.upazila_id, loadThanasUnions]);

  function pickDivision(id: number | null) {
    onChange({ ...EMPTY_LOCATION, division_id: id });
    setDistricts([]);
    setUpazilas([]);
    setThanas([]);
    setUnions([]);
    if (id) loadDistricts(id);
  }

  function pickDistrict(id: number | null) {
    onChange({ division_id: value.division_id, district_id: id, upazila_id: null, thana_id: null, union_id: null });
    setUpazilas([]);
    setThanas([]);
    setUnions([]);
    if (id) loadUpazilas(id);
  }

  function pickUpazila(id: number | null) {
    onChange({ ...value, upazila_id: id, thana_id: null, union_id: null });
    setThanas([]);
    setUnions([]);
    if (id) loadThanasUnions(id);
  }

  const num = (v: string) => (v === '' ? null : Number(v));

  const sel = compact ? selectCompactCls : selectCls;
  const labelCls = compact ? 'sr-only' : 'mb-1.5 block text-sm font-bold text-ink';
  const fieldCls = compact ? 'min-w-[128px] flex-1' : undefined;

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-3'}>
      <div className={fieldCls}>
        <label className={labelCls}>বিভাগ</label>
        <select
          value={value.division_id ?? ''}
          onChange={(e) => pickDivision(num(e.target.value))}
          className={sel}
          aria-label="বিভাগ"
        >
          <option value="">বিভাগ বেছে নিন</option>
          {divisions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name_bn}
            </option>
          ))}
        </select>
      </div>

      <div className={compact ? 'contents' : 'grid grid-cols-1 gap-3 sm:grid-cols-2'}>
        <div className={fieldCls}>
          <label className={labelCls}>জেলা</label>
          <select
            value={value.district_id ?? ''}
            onChange={(e) => pickDistrict(num(e.target.value))}
            disabled={!value.division_id}
            className={sel}
            aria-label="জেলা"
          >
            <option value="">জেলা বেছে নিন</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name_bn}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>উপজেলা</label>
          <select
            value={value.upazila_id ?? ''}
            onChange={(e) => pickUpazila(num(e.target.value))}
            disabled={!value.district_id}
            className={sel}
            aria-label="উপজেলা"
          >
            <option value="">উপজেলা বেছে নিন</option>
            {upazilas.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name_bn}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>থানা</label>
          <select
            value={value.thana_id ?? ''}
            onChange={(e) => onChange({ ...value, thana_id: num(e.target.value) })}
            disabled={!value.upazila_id}
            className={sel}
            aria-label="থানা"
          >
            <option value="">থানা বেছে নিন (ঐচ্ছিক)</option>
            {thanas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name_bn}
              </option>
            ))}
          </select>
        </div>
        <div className={fieldCls}>
          <label className={labelCls}>ইউনিয়ন</label>
          <select
            value={value.union_id ?? ''}
            onChange={(e) => onChange({ ...value, union_id: num(e.target.value) })}
            disabled={!value.upazila_id}
            className={sel}
            aria-label="ইউনিয়ন"
          >
            <option value="">ইউনিয়ন বেছে নিন (ঐচ্ছিক)</option>
            {unions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name_bn}
              </option>
            ))}
          </select>
        </div>
      </div>
      {!compact && (
        <p className="text-xs text-ink-soft">
          ধাপে ধাপে পুরো বাংলাদেশের তথ্য যোগ হচ্ছে — এখন ময়মনসিংহ বিভাগ সক্রিয় আছে।
        </p>
      )}
    </div>
  );
}
