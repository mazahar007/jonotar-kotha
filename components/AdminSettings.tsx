'use client';

import { useEffect, useState } from 'react';
import type { EmergencyNumber, SiteSettings } from '@/lib/settings';
import { IconX } from '@/components/icons';

/**
 * Phase 21aj — admin "সেটিংস" tab: the site's editable content.
 * Hero badge / headline lines / subtext / feature pills, site name, and
 * the emergency numbers shown on the home rail + SOS page. Saves via
 * PUT /api/settings (admin session enforced by middleware).
 */

const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-brand';

export default function AdminSettings() {
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [pillsText, setPillsText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data = (await res.json()) as SiteSettings;
        setForm(data);
        setPillsText(data.hero_pills.join(', '));
      } catch {
        /* keep empty — admin can still type values */
      }
    })();
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    if (!form) return;
    setForm({ ...form, [key]: value });
  }

  function setNumber(i: number, patch: Partial<EmergencyNumber>) {
    if (!form) return;
    const next = form.emergency_numbers.map((n, j) => (j === i ? { ...n, ...patch } : n));
    setForm({ ...form, emergency_numbers: next });
  }

  async function save() {
    if (!form) return;
    setBusy(true);
    setMsg('');
    try {
      const payload = {
        ...form,
        hero_pills: pillsText.split(',').map((p) => p.trim()).filter(Boolean),
      };
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      setMsg('সংরক্ষণ হয়েছে ✓');
    } catch {
      setMsg('সংরক্ষণ করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>;

  return (
    <div className="space-y-6">
      {/* Site name */}
      <section className="rounded-2xl bg-surface border border-line p-5">
        <h3 className="font-bold text-ink">সাইটের নাম</h3>
        <label className="mt-3 block">
          <span className="mb-1 block text-xs font-bold text-ink-soft">নাম</span>
          <input value={form.site_name} onChange={(e) => set('site_name', e.target.value)} className={inputCls} />
        </label>
      </section>

      {/* Hero */}
      <section className="rounded-2xl bg-surface border border-line p-5">
        <h3 className="font-bold text-ink">হোমপেজ হিরো</h3>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">ব্যাজ (লাইভ-এর পাশে)</span>
            <input value={form.hero_badge} onChange={(e) => set('hero_badge', e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">হেডলাইন — লাইন ১</span>
            <input value={form.hero_line1} onChange={(e) => set('hero_line1', e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">হেডলাইন — লাইন ২ (গ্রেডিয়েন্ট)</span>
            <input value={form.hero_line2} onChange={(e) => set('hero_line2', e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">হেডলাইন — লাইন ৩ (গ্রেডিয়েন্ট)</span>
            <input value={form.hero_line3} onChange={(e) => set('hero_line3', e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">সাবটেক্সট</span>
            <textarea
              value={form.hero_subtext}
              onChange={(e) => set('hero_subtext', e.target.value)}
              rows={3}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">ফিচার পিল (কমা দিয়ে আলাদা করুন)</span>
            <input value={pillsText} onChange={(e) => setPillsText(e.target.value)} className={inputCls} />
          </label>
        </div>
      </section>

      {/* Emergency numbers */}
      <section className="rounded-2xl bg-surface border border-line p-5">
        <h3 className="font-bold text-ink">জরুরি নম্বর</h3>
        <p className="mt-1 text-xs text-ink-soft">
          হোমপেজের জরুরি নম্বর কার্ড + SOS পেজের কল বাটনে দেখাবে। প্রথম নম্বরটি SOS-এর প্রধান নম্বর।
        </p>
        <div className="mt-3 space-y-2">
          {form.emergency_numbers.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={n.name}
                onChange={(e) => setNumber(i, { name: e.target.value })}
                placeholder="নাম (যেমন: জাতীয় জরুরি সেবা)"
                className={inputCls}
              />
              <input
                value={n.number}
                onChange={(e) => setNumber(i, { number: e.target.value.replace(/[^0-9]/g, '') })}
                placeholder="নম্বর"
                inputMode="tel"
                className={`${inputCls} !w-28 shrink-0`}
              />
              <button
                type="button"
                onClick={() => set('emergency_numbers', form.emergency_numbers.filter((_, j) => j !== i))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300"
                aria-label="মুছুন"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => set('emergency_numbers', [...form.emergency_numbers, { name: '', number: '' }])}
          className="mt-3 w-full rounded-2xl border-2 border-dashed border-line-strong py-2.5 text-sm font-bold text-ink-soft"
        >
          + নম্বর যোগ করুন
        </button>
      </section>

      {msg && <p className="rounded-xl bg-surface border border-line px-4 py-3 text-center text-sm font-bold text-ink">{msg}</p>}

      <button
        onClick={save}
        disabled={busy}
        className="w-full rounded-2xl btn-gradient py-3.5 font-bold text-white disabled:opacity-50"
      >
        {busy ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
      </button>
    </div>
  );
}
