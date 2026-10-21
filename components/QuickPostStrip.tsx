'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import LoginPromptModal from '@/components/LoginPromptModal';
import { IconPin } from '@/components/icons';
import { useMember } from '@/lib/member';
import { announceBadges } from '@/lib/badges-client';
import { PRESETS, type Preset } from '@/lib/presets';
import { ROAD_STATUS_META } from '@/lib/road-status';

/**
 * Phase 14 — "⚡ এক ট্যাপে জানান" strip.
 * Big preset buttons that post INSTANTLY to the member's current area
 * (self-declared, Phase 3) — or the area picked via "বদলাও".
 *
 * - Logged-out tap → login prompt modal (no post).
 * - Anti-double-tap: buttons disabled while posting + 3s debounce.
 * - Optimistic UI: tapped button shows ✓ instantly; request syncs in background.
 * - Recent-preset memory: last used preset gets a highlight ring (localStorage).
 * - Success sheet carries the user's exact wording — no edit affordance here.
 */

const STRIP_PRESET_KEYS = [
  'heavy_traffic',
  'light_traffic',
  'incident',
  'power_out',
  'power_back',
  'road_bad',
  'waterlogged',
  'accident',
  'all_normal',
];

const STRIP_PRESETS: Preset[] = STRIP_PRESET_KEYS.map((k) =>
  PRESETS.find((p) => p.key === k)
).filter((p): p is Preset => Boolean(p));

const LAST_PRESET_KEY = 'jk_last_preset';
const DEBOUNCE_MS = 3000;

function areaQuery(sel: LocationSelection): string {
  const p = new URLSearchParams();
  if (sel.division_id != null) p.set('division_id', String(sel.division_id));
  if (sel.district_id != null) p.set('district_id', String(sel.district_id));
  if (sel.upazila_id != null) p.set('upazila_id', String(sel.upazila_id));
  if (sel.thana_id != null) p.set('thana_id', String(sel.thana_id));
  if (sel.union_id != null) p.set('union_id', String(sel.union_id));
  return p.toString();
}

export default function QuickPostStrip({ onPosted }: { onPosted?: () => void }) {
  const { member } = useMember();

  const [customArea, setCustomArea] = useState<LocationSelection | null>(null);
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSel, setPickerSel] = useState<LocationSelection>(EMPTY_LOCATION);

  const [showLogin, setShowLogin] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);
  const [posting, setPosting] = useState(false);
  const [optimisticKey, setOptimisticKey] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [lastPreset, setLastPreset] = useState<string | null>(null);
  const lastTapAt = useRef(0);

  useEffect(() => {
    try {
      setLastPreset(localStorage.getItem(LAST_PRESET_KEY));
    } catch {
      /* ignore */
    }
  }, []);

  const effectiveArea: LocationSelection = customArea ?? (member ? member.current : EMPTY_LOCATION);
  const targetLabel = customArea
    ? (customLabel ?? 'নির্বাচিত এলাকা')
    : (member?.current_breadcrumb || 'এলাকা');

  const resolveLabel = useCallback(async (sel: LocationSelection) => {
    try {
      const res = await fetch(`/api/roads/quick-post?${areaQuery(sel)}`);
      const data = await res.json().catch(() => null);
      setCustomLabel(data && typeof data.label === 'string' ? data.label : 'নির্বাচিত এলাকা');
    } catch {
      setCustomLabel('নির্বাচিত এলাকা');
    }
  }, []);

  function openPicker() {
    setPickerSel(customArea ?? (member ? member.current : EMPTY_LOCATION));
    setPickerOpen(true);
  }

  function confirmPicker() {
    setCustomArea(pickerSel);
    setCustomLabel(null);
    setPickerOpen(false);
    void resolveLabel(pickerSel);
  }

  async function post(preset: Preset) {
    if (member === undefined) return; // still resolving session
    if (!member) {
      // Phase 17 — logged-out tap → login → land on /roads/submit with this
      // preset + area prefilled (returnTo preserves the query params).
      setPendingPreset(preset);
      setShowLogin(true);
      return;
    }
    const now = Date.now();
    if (posting || now - lastTapAt.current < DEBOUNCE_MS) return; // 3s anti-double-tap
    lastTapAt.current = now;
    setPosting(true);
    setOptimisticKey(preset.key); // optimistic ✓ instantly
    setError('');
    try {
      const res = await fetch('/api/roads/quick-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset_key: preset.key, ...effectiveArea }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 401) {
        setShowLogin(true);
        return;
      }
      if (!res.ok) throw new Error((data && data.error) || 'পাঠানো যায়নি');
      try {
        localStorage.setItem(LAST_PRESET_KEY, preset.key);
      } catch {
        /* ignore */
      }
      setLastPreset(preset.key);
      setSuccessId(data?.detail?.id ?? null);
      announceBadges(data?.newBadges);
      onPosted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setPosting(false);
      setOptimisticKey(null);
    }
  }

  const loading = member === undefined;

  // Phase 17 — login redirect target: submit page with the tapped preset +
  // effective area prefilled.
  const loginReturnTo = (() => {
    const q = areaQuery(effectiveArea);
    const base = pendingPreset ? `preset=${pendingPreset.key}` : '';
    const query = [base, q].filter(Boolean).join('&');
    return `/roads/submit${query ? `?${query}` : ''}`;
  })();

  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-ink">⚡ এক ট্যাপে জানান</h3>
        <div className="flex items-center gap-2">
          {/* Phase 17 — full submit page */}
          <Link
            href="/roads/submit"
            className="flex min-h-11 items-center rounded-full bg-cream px-3.5 text-xs font-bold text-ink transition hover:bg-cream-dark"
          >
            ✍️ বিস্তারিত পোস্ট করুন
          </Link>
          <p className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
            <IconPin className="h-3.5 w-3.5 text-brand" />
            <span>
              📍 {targetLabel}-এ পোস্ট হবে
            </span>
            <button
              type="button"
              onClick={openPicker}
              className="min-h-11 rounded-full px-2 font-bold text-brand underline underline-offset-2 transition active:scale-95"
            >
              বদলাও
            </button>
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {STRIP_PRESETS.map((p) => {
          const meta = ROAD_STATUS_META[p.status];
          const isOptimistic = optimisticKey === p.key;
          const isLast = !isOptimistic && lastPreset === p.key;
          return (
            <button
              key={p.key}
              type="button"
              disabled={loading || posting}
              onClick={() => post(p)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-[13px] font-bold text-ink transition active:scale-[0.96] disabled:opacity-60 ${
                isLast ? 'border-brand bg-orange-50 ring-2 ring-brand/40' : 'border-[#efe3d3] bg-cream hover:bg-cream-dark'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden />
              {isOptimistic ? '✓ পাঠানো হলো' : p.short ?? p.label}
            </button>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] text-ink-soft">
        {member
          ? 'ট্যাপ করলেই আপনার এলাকায় পোস্ট হয়ে যাবে — কোনো লেখা লাগবে না।'
          : 'পোস্ট করতে প্রথমে লগিন করুন।'}
      </p>
      {error && <p className="mt-1 text-xs font-bold text-brand">{error}</p>}

      {/* Area picker */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="এলাকা বেছে নিন">
          <button type="button" aria-label="বন্ধ করুন" onClick={() => setPickerOpen(false)} className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-5 pb-8 shadow-2xl sm:rounded-3xl">
            <h3 className="mb-3 font-bold text-ink">কোন এলাকায় পোস্ট করবেন?</h3>
            <LocationPicker value={pickerSel} onChange={setPickerSel} />
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={confirmPicker}
                className="flex min-h-12 flex-1 items-center justify-center rounded-2xl bg-brand font-bold text-white transition active:scale-[0.98]"
              >
                ঠিক আছে
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="min-h-12 rounded-2xl bg-cream px-5 font-bold text-ink transition active:scale-[0.98]"
              >
                বাতিল
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login prompt — Phase 17: after login, land on /roads/submit with
          the tapped preset + area prefilled. */}
      <LoginPromptModal
        open={showLogin}
        onClose={() => { setShowLogin(false); setPendingPreset(null); }}
        returnTo={loginReturnTo}
      />

      {/* Success sheet — exact user wording, no edit affordance */}
      {successId !== null && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="পোস্ট সফল">
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setSuccessId(null)}
            className="absolute inset-0 bg-black/50"
          />
          <div className="relative w-full max-w-sm rounded-t-3xl bg-white p-6 pb-8 text-center shadow-2xl sm:rounded-3xl">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl" aria-hidden>
              ✅
            </div>
            <p className="text-[15px] font-bold leading-relaxed text-ink">
              ✅ পোস্ট হয়েছে — এখানে আর বদলানো যাবে না
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              আপনার এলাকার ফিডে সবার কাছে দেখা যাবে।
            </p>
            <Link
              href={`/roads/${successId}`}
              className="mt-5 flex min-h-12 items-center justify-center rounded-2xl bg-brand px-4 font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98]"
            >
              বিস্তারিত দেখো
            </Link>
            <button
              type="button"
              onClick={() => setSuccessId(null)}
              className="mt-2 min-h-11 w-full rounded-2xl px-4 font-bold text-ink-soft transition active:scale-[0.98]"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
