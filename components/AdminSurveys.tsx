'use client';

import { useCallback, useEffect, useState } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import type { SurveyTargetLevel, SurveyWithState } from '@/lib/types';

const LEVELS: { value: SurveyTargetLevel; label: string }[] = [
  { value: 'all', label: 'সারা দেশ' },
  { value: 'division', label: 'বিভাগ' },
  { value: 'district', label: 'জেলা' },
  { value: 'upazila', label: 'উপজেলা' },
  { value: 'thana', label: 'থানা' },
  { value: 'union', label: 'ইউনিয়ন' },
];

const inputCls =
  'w-full rounded-xl border border-[#efe3d3] bg-white px-3 py-2.5 text-sm outline-none focus:border-brand';

export default function AdminSurveys() {
  const [surveys, setSurveys] = useState<SurveyWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SurveyWithState | null>(null);

  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [level, setLevel] = useState<SurveyTargetLevel>('all');
  const [loc, setLoc] = useState<LocationSelection>(EMPTY_LOCATION);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/surveys?all=1', { cache: 'no-store' });
      const data = await res.json();
      setSurveys(Array.isArray(data) ? data : []);
    } catch {
      setSurveys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function targetId(): number | null {
    switch (level) {
      case 'division':
        return loc.division_id;
      case 'district':
        return loc.district_id;
      case 'upazila':
        return loc.upazila_id;
      case 'thana':
        return loc.thana_id;
      case 'union':
        return loc.union_id;
      default:
        return null;
    }
  }

  async function create() {
    setFormError('');
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setFormError('প্রশ্ন লিখুন');
    if (opts.length < 2) return setFormError('কমপক্ষে ২টি অপশন দিন');
    if (level !== 'all' && !targetId()) return setFormError('জরিপের এলাকা বেছে নিন');
    setSaving(true);
    try {
      const res = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim(), options: opts, target_level: level, target_id: targetId() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'তৈরি করা যায়নি');
      setQuestion('');
      setOptions(['', '']);
      setLevel('all');
      setLoc(EMPTY_LOCATION);
      load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'তৈরি করা যায়নি');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(s: SurveyWithState) {
    const res = await fetch(`/api/surveys/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: s.status === 'active' ? 'closed' : 'active' }),
    });
    if (res.ok) load();
    else alert('আপডেট করা যায়নি');
  }

  async function remove(id: number) {
    if (!confirm('জরিপটি মুছে ফেলবেন? সব ভোটও মুছে যাবে।')) return;
    const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
    if (res.ok) {
      if (openId === id) setOpenId(null);
      load();
    } else alert('মোছা যায়নি');
  }

  async function openResults(id: number) {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      return;
    }
    setOpenId(id);
    setDetail(null);
    const res = await fetch(`/api/surveys/${id}`, { cache: 'no-store' });
    if (res.ok) setDetail(await res.json());
  }

  return (
    <div>
      {/* Create form */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-bold text-ink">নতুন জরিপ তৈরি করুন</h2>
        <div className="mt-3 space-y-3">
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="জরিপের প্রশ্ন লিখুন..." className={inputCls} />
          <div className="space-y-2">
            {options.map((o, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={o}
                  onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))}
                  placeholder={`অপশন ${i + 1}`}
                  className={inputCls}
                />
                {options.length > 2 && (
                  <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="shrink-0 rounded-xl bg-red-50 px-3 text-sm font-bold text-brand">
                    মুছুন
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button onClick={() => setOptions([...options, ''])} className="text-sm font-bold text-ink-soft">
                + আরেকটি অপশন যোগ করুন (সর্বোচ্চ ৬)
              </button>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-ink-soft">জরিপের এলাকা (কারা ভোট দিতে পারবে)</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as SurveyTargetLevel)} className={inputCls}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          {level !== 'all' && (
            <div className="rounded-xl bg-cream p-3">
              <LocationPicker value={loc} onChange={setLoc} />
            </div>
          )}
          {formError && <p className="text-sm font-semibold text-brand">{formError}</p>}
          <button onClick={create} disabled={saving} className="w-full rounded-2xl bg-brand py-3 font-bold text-white disabled:opacity-50">
            {saving ? 'তৈরি হচ্ছে...' : 'জরিপ প্রকাশ করুন'}
          </button>
        </div>
      </div>

      {/* List */}
      <h2 className="mb-2 mt-6 font-bold text-ink">সব জরিপ</h2>
      {loading && <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
      <div className="space-y-2">
        {surveys.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ink">{s.question}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  এলাকা: {s.target_label} · মোট ভোট: {s.results?.total ?? 0} ·{' '}
                  {s.status === 'active' ? 'চলমান' : 'বন্ধ'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-brand'}`}>
                {s.status === 'active' ? 'চলমান' : 'বন্ধ'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button onClick={() => openResults(s.id)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
                {openId === s.id ? 'ফলাফল লুকান' : 'ফলাফল দেখুন'}
              </button>
              <button onClick={() => toggleStatus(s)} className="rounded-full bg-cream-dark px-3 py-1.5 text-xs font-bold text-ink">
                {s.status === 'active' ? 'বন্ধ করুন' : 'আবার চালু করুন'}
              </button>
              <button onClick={() => remove(s.id)} className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand">
                মুছুন
              </button>
            </div>

            {openId === s.id && (
              <div className="mt-4 border-t border-[#f3e9da] pt-4">
                {!detail ? (
                  <p className="text-sm text-ink-soft">লোড হচ্ছে...</p>
                ) : (
                  <>
                    <div className="space-y-2.5">
                      {detail.results?.per_option.map((o, i) => (
                        <div key={i}>
                          <div className="mb-1 flex justify-between text-sm">
                            <span className="font-semibold text-ink">{o.option}</span>
                            <span className="text-xs font-bold text-ink-soft">{o.pct}% · {o.count} ভোট</span>
                          </div>
                          <div className="h-2.5 overflow-hidden rounded-full bg-cream-dark">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${o.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {detail.breakdown && (
                      <>
                        <BreakdownTable title="থানাভিত্তিক ফল" rows={detail.breakdown.by_thana} options={detail.options} />
                        <BreakdownTable title="ইউনিয়নভিত্তিক ফল" rows={detail.breakdown.by_union} options={detail.options} />
                      </>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        {!loading && surveys.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">এখনো কোনো জরিপ নেই।</p>
        )}
      </div>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
  options,
}: {
  title: string;
  rows: { name: string; total: number; per_option: number[] }[];
  options: string[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-sm font-bold text-ink">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-[#f3e9da]">
        <table className="w-full min-w-[420px] text-left text-xs">
          <thead>
            <tr className="bg-cream text-ink-soft">
              <th className="px-3 py-2 font-bold">এলাকা</th>
              {options.map((o, i) => (
                <th key={i} className="px-3 py-2 font-bold">{o}</th>
              ))}
              <th className="px-3 py-2 font-bold">মোট</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-[#f3e9da]">
                <td className="px-3 py-2 font-semibold text-ink">{r.name}</td>
                {r.per_option.map((c, i) => (
                  <td key={i} className="px-3 py-2 text-ink-soft">{c}</td>
                ))}
                <td className="px-3 py-2 font-bold text-ink">{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
