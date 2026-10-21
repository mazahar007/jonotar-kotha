'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import MediaPicker, { type MediaItem } from '@/components/MediaPicker';
import SectionHeader from '@/components/SectionHeader';
import { useMember } from '@/lib/member';
import { announceBadges } from '@/lib/badges-client';
import { PRESET_GROUPS, presetByKey, type Preset } from '@/lib/presets';
import { ROAD_STATUS_META } from '@/lib/road-status';
import { IconChevronLeft, IconRoute, IconSend } from '@/components/icons';
import type { Road, RoadKind, RoadStatus } from '@/lib/types';

const AREA_KEYS = ['division_id', 'district_id', 'upazila_id', 'thana_id', 'union_id'] as const;
const inputCls =
  'w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand';

function areaQuery(sel: LocationSelection): string {
  const p = new URLSearchParams();
  for (const k of AREA_KEYS) {
    const v = sel[k];
    if (v != null) p.set(k, String(v));
  }
  return p.toString();
}

function areaFromParams(sp: URLSearchParams): LocationSelection | null {
  const hasAny = AREA_KEYS.some((k) => sp.get(k) != null);
  if (!hasAny) return null;
  const sel = { ...EMPTY_LOCATION };
  for (const k of AREA_KEYS) {
    const v = sp.get(k);
    sel[k] = v != null && v !== '' ? Number(v) : null;
  }
  return sel;
}

/**
 * Phase 17 — "অবস্থা জানান" submit page.
 * Login required: logged-out visits bounce to /register?returnTo=… (prefill
 * params preserved). Fields: area → place (existing + new) → condition
 * presets → optional note → optional photo → post.
 */
function SubmitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { member } = useMember();

  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [areaInit, setAreaInit] = useState(false);
  const [places, setPlaces] = useState<Road[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeId, setPlaceId] = useState<string>('new');
  const [newName, setNewName] = useState('');
  const [newKind, setNewKind] = useState<RoadKind>('road');
  const [status, setStatus] = useState<RoadStatus | null>(null);
  const [note, setNote] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<number | null>(null);

  const prefillPreset = searchParams.get('preset');
  const prefillRoadId = searchParams.get('road_id');

  // Login gate: logged-out → /register?returnTo=<this page + query>.
  useEffect(() => {
    if (member === null) {
      const here = `/roads/submit${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      router.replace(`/register?returnTo=${encodeURIComponent(here)}`);
    }
  }, [member, router, searchParams]);

  // Default area: prefill params → member's current area.
  useEffect(() => {
    if (areaInit) return;
    if (member === undefined) return;
    const fromParams = areaFromParams(searchParams);
    setArea(fromParams ?? (member ? member.current : EMPTY_LOCATION));
    setAreaInit(true);
  }, [areaInit, member, searchParams]);

  // Preset prefill (e.g. from one-tap login redirect).
  useEffect(() => {
    if (!prefillPreset) return;
    const p = presetByKey(prefillPreset);
    if (p) setStatus((s) => s ?? p.status);
  }, [prefillPreset]);

  // Road prefill (from card one-tap login redirect).
  useEffect(() => {
    if (prefillRoadId) setPlaceId(prefillRoadId);
  }, [prefillRoadId]);

  const loadPlaces = useCallback(async (sel: LocationSelection) => {
    setPlacesLoading(true);
    try {
      const q = areaQuery(sel);
      const res = await fetch(`/api/roads${q ? `?${q}` : ''}`, { cache: 'no-store' });
      const data = await res.json().catch(() => []);
      setPlaces(Array.isArray(data) ? data : []);
    } catch {
      setPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (areaInit) void loadPlaces(area);
  }, [area, areaInit, loadPlaces]);

  const selectedPlace = useMemo(
    () => places.find((r) => String(r.id) === placeId) ?? null,
    [places, placeId]
  );

  function pickPreset(p: Preset) {
    setStatus(p.status);
  }

  async function submit() {
    setError('');
    if (!status) return setError('অবস্থা বেছে নিন');
    const isNew = placeId === 'new';
    if (isNew && !newName.trim()) return setError('নতুন জায়গার নাম লিখুন');
    if (sending) return;
    setSending(true);
    try {
      // Photo upload (optional; demo mode returns no urls — post goes on without it).
      let mediaUrl: string | null = null;
      if (media.length > 0) {
        const form = new FormData();
        form.append('files', media[0].file);
        const up = await fetch('/api/upload', { method: 'POST', body: form });
        const ud = await up.json().catch(() => ({}));
        if (Array.isArray(ud.urls) && ud.urls.length > 0) mediaUrl = ud.urls[0];
      }
      const preset = prefillPreset ? presetByKey(prefillPreset) : undefined;
      const res = await fetch('/api/roads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          road_id: isNew ? null : Number(placeId),
          name: isNew ? newName.trim() : undefined,
          kind: isNew ? newKind : undefined,
          ...Object.fromEntries(AREA_KEYS.map((k) => [k, area[k]])),
          status,
          note: note.trim() || (preset && preset.status === status ? preset.label : ''),
          media_url: mediaUrl,
          preset_key: preset && preset.status === status ? preset.key : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        router.replace(`/register?returnTo=${encodeURIComponent('/roads/submit')}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'পোস্ট করা যায়নি');
      announceBadges(data?.newBadges);
      setDoneId(data.roadId ?? null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'পোস্ট করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  }

  if (member === undefined || member === null) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-ink-soft">লোড হচ্ছে...</p>
      </main>
    );
  }

  // Success screen
  if (doneId !== null) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl" aria-hidden>
            ✅
          </div>
          <h1 className="text-xl font-bold text-ink">পোস্ট হয়েছে!</h1>
          <p className="mt-1 text-sm text-ink-soft">আপনার এলাকার সবাই এখন এই অবস্থা দেখতে পাবে।</p>
          <div className="mt-6 space-y-2">
            <Link
              href={`/roads/${doneId}`}
              className="flex min-h-13 items-center justify-center rounded-2xl bg-brand px-4 py-3.5 font-bold text-white shadow-lg shadow-red-200 transition active:scale-[0.98]"
            >
              জায়গাটি দেখুন
            </Link>
            <button
              type="button"
              onClick={() => {
                setDoneId(null);
                setStatus(null);
                setNote('');
                setMedia([]);
                setNewName('');
                setPlaceId('new');
              }}
              className="min-h-12 w-full rounded-2xl bg-cream px-4 font-bold text-ink transition active:scale-[0.98]"
            >
              আরও পোস্ট করুন
            </button>
            <Link href="/roads" className="block min-h-11 pt-1 text-sm font-bold text-ink-soft">
              সব রোড ও মোড় দেখুন
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Link href="/roads" className="mb-3 flex min-h-11 w-fit items-center gap-1 text-sm font-bold text-ink-soft">
        <IconChevronLeft className="h-4 w-4" />
        রোড ও মোড়ের অবস্থা
      </Link>
      <SectionHeader
        as="h1"
        icon={<IconRoute className="h-6 w-6" />}
        tileClassName="bg-orange-100 text-orange-700"
        title="অবস্থা জানান"
        subtitle="কোন জায়গার কী অবস্থা — সবাইকে জানান"
      />

      <div className="mt-5 space-y-5">
        {/* 1 — এলাকা */}
        <section className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">১. এলাকা</h2>
          <div className="mt-3">
            <LocationPicker value={area} onChange={(s) => { setArea(s); setPlaceId('new'); }} />
          </div>
        </section>

        {/* 2 — জায়গা */}
        <section className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">২. কোন জায়গার অবস্থা?</h2>
          <select
            value={placeId}
            onChange={(e) => setPlaceId(e.target.value)}
            className={`${inputCls} mt-3 min-h-13`}
            aria-label="জায়গা বেছে নিন"
          >
            <option value="new">＋ নতুন জায়গা যোগ করুন</option>
            {placesLoading ? (
              <option disabled>লোড হচ্ছে...</option>
            ) : (
              places.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}{r.kind === 'spot' ? ' (মোড়/স্থান)' : ''}
                </option>
              ))
            )}
          </select>
          {placeId === 'new' && (
            <div className="mt-3 space-y-3">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="জায়গার নাম — যেমন: চরপাড়া মোড়"
                className={inputCls}
                maxLength={120}
              />
              <div className="flex gap-2" role="radiogroup" aria-label="জায়গার ধরন">
                {(
                  [
                    { v: 'road', label: '🛣️ রোড' },
                    { v: 'spot', label: '📍 মোড় / স্থান' },
                  ] as { v: RoadKind; label: string }[]
                ).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    role="radio"
                    aria-checked={newKind === o.v}
                    onClick={() => setNewKind(o.v)}
                    className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold transition ${
                      newKind === o.v ? 'bg-ink text-white' : 'bg-cream text-ink'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedPlace && (
            <p className="mt-2 text-xs text-ink-soft">
              বর্তমান অবস্থা:{' '}
              <span className="font-bold text-ink">
                {selectedPlace.current_status
                  ? ROAD_STATUS_META[selectedPlace.current_status]?.label ?? selectedPlace.current_status
                  : 'এখনো কোনো আপডেট নেই'}
              </span>
            </p>
          )}
        </section>

        {/* 3 — অবস্থা */}
        <section className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">৩. বর্তমান অবস্থা</h2>
          <div className="mt-3 space-y-3">
            {PRESET_GROUPS.map((g) => (
              <div key={g.title}>
                <p className="mb-1.5 text-xs font-bold text-ink-soft">{g.title}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {g.presets.map((p) => {
                    const active = status === p.status;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => pickPreset(p)}
                        aria-pressed={active}
                        className={`flex min-h-13 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-[13px] font-bold transition active:scale-[0.96] ${
                          active
                            ? 'border-brand bg-orange-50 ring-2 ring-brand/40'
                            : 'border-[#efe3d3] bg-cream hover:bg-cream-dark'
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${ROAD_STATUS_META[p.status].dot}`} aria-hidden />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4 — নোট + ছবি */}
        <section className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">৪. নোট ও ছবি <span className="font-semibold text-ink-soft">(ঐচ্ছিক)</span></h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            placeholder="আরও কিছু বলতে চান? যেমন: কোন পাশে জ্যাম বেশি..."
            rows={3}
            className={`${inputCls} mt-3`}
          />
          <p className="mt-1 text-right text-[11px] text-ink-soft">{note.length}/500</p>
          <div className="mt-2">
            <MediaPicker items={media} onChange={(items) => setMedia(items.slice(0, 1))} />
          </div>
        </section>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={sending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold text-white shadow-lg shadow-red-200 disabled:opacity-60"
        >
          <IconSend className="h-5 w-5" />
          {sending ? 'পোস্ট হচ্ছে...' : 'পোস্ট করুন'}
        </button>
      </div>
    </main>
  );
}

export default function SubmitPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<main className="mx-auto w-full max-w-2xl px-4 py-16 text-center"><p className="text-sm text-ink-soft">লোড হচ্ছে...</p></main>}>
        <SubmitForm />
      </Suspense>
      <BottomNav />
    </>
  );
}
