'use client';

import { useEffect, useState } from 'react';
import { IconAlert, IconCheck, IconMegaphone, IconSend, IconX } from './icons';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from './LocationPicker';
import { bnNum } from '@/lib/time';

interface Broadcast {
  id: number;
  title: string;
  body: string;
  scope_division_id: number | null;
  scope_district_id: number | null;
  scope_upazila_id: number | null;
  scope_thana_id: number | null;
  expires_at: string;
  created_at: string;
}

interface DeliveryResult {
  delivered: 'push' | 'inapp';
  reason?: string;
  pushSent: number;
  pushFailed: number;
  pruned: number;
  inappId: number;
}

const EXPIRY_OPTIONS = [
  { hours: 6, label: '৬ ঘণ্টা' },
  { hours: 12, label: '১২ ঘণ্টা' },
  { hours: 24, label: '২৪ ঘণ্টা (১ দিন)' },
  { hours: 48, label: '৪৮ ঘণ্টা (২ দিন)' },
  { hours: 168, label: '৭ দিন' },
];

function isActive(b: Broadcast): boolean {
  return new Date(b.expires_at).getTime() > Date.now();
}

function scopeLabel(b: Broadcast): string {
  const parts: string[] = [];
  if (b.scope_division_id == null && b.scope_district_id == null && b.scope_upazila_id == null && b.scope_thana_id == null)
    return 'সারাদেশ';
  if (b.scope_division_id != null) parts.push('বিভাগ');
  if (b.scope_district_id != null) parts.push('জেলা');
  if (b.scope_upazila_id != null) parts.push('উপজেলা');
  if (b.scope_thana_id != null) parts.push('থানা');
  return parts.join(' › ');
}

/**
 * Phase 9 — admin "জরুরি ঘোষণা" tab.
 * Create form: title, body, area scope (cascading picker), expiry
 * (default 24h), live preview. On create the broadcast is sent through
 * Phase 8 push infra with area targeting; the honest delivery result
 * (push vs in-app fallback) is shown. Past broadcasts can be deleted.
 */
export default function AdminBroadcasts() {
  const [list, setList] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [scope, setScope] = useState<LocationSelection>(EMPTY_LOCATION);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/broadcasts', { cache: 'no-store' });
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          division_id: scope.division_id,
          district_id: scope.district_id,
          upazila_id: scope.upazila_id,
          thana_id: scope.thana_id,
          hours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'প্রকাশ করা যায়নি');
        return;
      }
      setResult(data.delivery as DeliveryResult);
      setTitle('');
      setBody('');
      setScope(EMPTY_LOCATION);
      load();
    } catch {
      setError('প্রকাশ করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm('এই ঘোষণাটি মুছে ফেলবেন?')) return;
    const res = await fetch(`/api/admin/broadcasts/${id}`, { method: 'DELETE' });
    if (res.ok) load();
    else alert('মোছা যায়নি');
  }

  const activeCount = list.filter(isActive).length;

  return (
    <div className="space-y-4">
      {/* Create form */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-brand">
            <IconMegaphone className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">নতুন জরুরি ঘোষণা</p>
            <p className="text-xs text-ink-soft">
              প্রকাশ করলেই সংশ্লিষ্ট এলাকার সবাইকে পাঠানো হবে · বর্তমানে {bnNum(activeCount)}টি সক্রিয়
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">শিরোনাম</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="যেমন: ⚠️ বন্যা সতর্কতা — ময়মনসিংহ সদর"
              className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">বিস্তারিত বার্তা</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              placeholder="কী ঘটছে, কাদের জন্য, কী করতে হবে — সংক্ষেপে লিখুন"
              className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-bold text-ink-soft">
              কোন এলাকার জন্য (খালি রাখলে সারাদেশ)
            </span>
            <LocationPicker value={scope} onChange={setScope} />
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-soft">কতক্ষণ দেখাবে</span>
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-3 text-sm outline-none focus:border-brand"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          {/* Preview */}
          {(title.trim() || body.trim()) && (
            <div>
              <span className="mb-1 block text-xs font-bold text-ink-soft">প্রিভিউ (হোম ব্যানার)</span>
              <div className="flex items-start gap-3 rounded-2xl bg-gradient-to-l from-red-600 to-red-700 p-4 text-white">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <IconAlert className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold">{title.trim() || 'শিরোনাম'}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/85">{body.trim()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={create}
          disabled={busy || !title.trim() || !body.trim()}
          className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          <IconSend className="h-4 w-4" />
          {busy ? 'প্রকাশ হচ্ছে...' : 'প্রকাশ ও পাঠান'}
        </button>

        {result && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p className="text-emerald-800">
              {result.delivered === 'push'
                ? `প্রকাশ হয়েছে — ${bnNum(result.pushSent)}টি ডিভাইসে পুশ গেছে`
                : 'প্রকাশ হয়েছে — সার্ভারে পুশ কী নেই, তাই সবার ইন-অ্যাপ নোটিফিকেশনে গেছে'}
              {result.pushFailed > 0 && ` (${bnNum(result.pushFailed)}টি ব্যর্থ)`}
            </p>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm">
            <IconX className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <p className="text-brand">{error}</p>
          </div>
        )}
      </div>

      {/* Past broadcasts */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="text-sm font-bold text-ink">পূর্বের ঘোষণা</p>
        {loading && <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>}
        {!loading && list.length === 0 && (
          <p className="rounded-xl bg-cream p-6 text-center text-sm text-ink-soft">কোনো ঘোষণা নেই।</p>
        )}
        <div className="mt-3 space-y-2">
          {list.map((b) => {
            const active = isActive(b);
            return (
              <div key={b.id} className="rounded-xl bg-cream p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">{b.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{b.body}</p>
                    <p className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold ${
                          active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {active ? 'সক্রিয়' : 'মেয়াদ শেষ'}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-ink-soft">
                        {scopeLabel(b)}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 font-semibold text-ink-soft">
                        মেয়াদ: {new Date(b.expires_at).toLocaleString('bn-BD')}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => remove(b.id)}
                    className="min-h-11 shrink-0 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-brand"
                  >
                    মুছুন
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
