'use client';

import { useCallback, useEffect, useState } from 'react';
import MediaPicker, { type MediaItem } from '@/components/MediaPicker';
import { QuickPresetPanel } from '@/components/QuickChips';
import LoginPromptModal from '@/components/LoginPromptModal';
import RoadStatusBadge, { ROAD_STATUS_DOT } from '@/components/RoadStatusBadge';
import StarRating from '@/components/StarRating';
import StatusRequestButton from '@/components/StatusRequestButton';
import { announceBadges } from '@/lib/badges-client';
import { IconClock, IconPin, IconRoute, IconSend } from '@/components/icons';
import { useMember } from '@/lib/member';
import { bnNum } from '@/lib/time';
import { ROAD_STATUS_LABEL, ROAD_STATUS_OPTIONS, type RoadDetail as RoadDetailData, type RoadStatus } from '@/lib/types';
import type { Preset } from '@/lib/presets';

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];
const isVideoUrl = (url: string) => VIDEO_EXT.some((e) => url.split('?')[0].toLowerCase().endsWith(e));

export default function RoadDetail({ id }: { id: number }) {
  const { member } = useMember();
  const [road, setRoad] = useState<RoadDetailData | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [status, setStatus] = useState<RoadStatus>('good');
  const [note, setNote] = useState('');
  const [reporter, setReporter] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [posted, setPosted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  // Phase 17 — preset tapped while logged out → prefill /roads/submit.
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/roads/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      setRoad(await res.json());
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  /** Upload the optional single photo via the Phase-2 /api/upload flow.
      Demo mode falls back to the local preview URL, like the report form. */
  async function uploadPhoto(): Promise<string | null> {
    if (media.length === 0) return null;
    const form = new FormData();
    form.append('files', media[0].file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok && Array.isArray(data.urls) && data.urls.length > 0) return data.urls[0] as string;
    } catch {
      /* fall through to demo preview */
    }
    return media[0].previewUrl;
  }

  async function submit() {
    if (member === null) {
      // Phase 14: logged-out members get the login prompt, not a failed post.
      setShowLogin(true);
      return;
    }
    if (!note.trim()) {
      setError('আপডেটের বিবরণ লিখুন।');
      return;
    }
    setSending(true);
    setError('');
    setPosted(false);
    try {
      const mediaUrl = await uploadPhoto();
      const res = await fetch(`/api/roads/${id}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          note: note.trim(),
          media_url: mediaUrl,
          reporter_name: reporter.trim() || member?.name || '',
        }),
      });
      if (res.status === 401) {
        setShowLogin(true);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'পাঠানো যায়নি');
      announceBadges(data?.newBadges);
      if (data && typeof data === 'object' && 'updates' in data) setRoad(data as RoadDetailData);
      else await load();
      setNote('');
      setMedia([]);
      setPosted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'পাঠানো যায়নি। আবার চেষ্টা করুন।');
    } finally {
      setSending(false);
    }
  }

  if (notFound) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
        <p className="rounded-2xl bg-surface border border-white/10 p-8 text-center text-sm text-ink-soft">রোড/স্থানটি পাওয়া যায়নি।</p>
      </main>
    );
  }
  if (!road) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
        <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      </main>
    );
  }

  const route = [road.from_place, road.to_place].filter(Boolean).join(' → ');
  const breadcrumb = [road.union_name, road.upazila_name, road.district_name].filter(Boolean) as string[];
  const isSpot = road.kind === 'spot';

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {/* Header */}
        <section className="rounded-2xl bg-surface border border-white/10 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 text-xl font-bold leading-snug text-ink">
              {road.name}
              {isSpot && (
                <span className="ml-2 inline-block rounded-full bg-violet-500/15 px-2.5 py-0.5 align-middle text-[11px] font-bold text-violet-300">
                  গুরুত্বপূর্ণ স্থান
                </span>
              )}
            </h1>
            <RoadStatusBadge status={road.current_status} size="lg" />
          </div>
          {!isSpot && route && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <IconRoute className="h-4 w-4 shrink-0 text-brand" /> {route}
            </p>
          )}
          {isSpot && road.locality_name && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
              <IconPin className="h-4 w-4 shrink-0 text-brand" /> এলাকা: {road.locality_name}
            </p>
          )}
          {breadcrumb.length > 0 && (
            <p className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-ink-soft">
              <IconPin className="h-3.5 w-3.5 text-brand" /> {breadcrumb.join(', ')}
            </p>
          )}
          <p className="mt-3 flex items-center gap-1 text-xs text-ink-soft">
            <IconClock className="h-3.5 w-3.5" />
            {road.latest_update
              ? `সর্বশেষ আপডেট: ${road.latest_update.time_ago} · মোট ${bnNum(road.update_count)}টি আপডেট`
              : 'এখনো কোনো আপডেট আসেনি'}
          </p>
          {/* Phase 18 — "বর্তমান অবস্থা জানতে চাই" (pending count shown subtly) */}
          <div className="mt-4 max-w-sm">
            <StatusRequestButton roadId={road.id} showPendingCount />
          </div>
        </section>

        {/* Post an update */}
        <section className="rounded-2xl bg-surface border border-white/10 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">আপডেট দিন</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            {isSpot
              ? 'এই স্থানের বর্তমান অবস্থা জানান — সবার কাছে লাইভ দেখা যাবে।'
              : 'এই রোডের বর্তমান অবস্থা জানান — সবার কাছে লাইভ দেখা যাবে।'}
          </p>

          {/* Phase 5 — one-tap quick updates */}
          <div className="mt-4 rounded-2xl bg-cream p-4">
            <p className="mb-2 text-sm font-bold text-ink">
              এক ট্যাপে জানান <span className="font-semibold text-ink-soft">(ট্যাপ করলেই আপডেট হয়ে যাবে)</span>
            </p>
            <QuickPresetPanel
              roadId={road.id}
              onUpdated={(d) => setRoad(d)}
              onLoginRequired={(p) => {
                setPendingPreset(p);
                setShowLogin(true);
              }}
            />
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink">বর্তমান অবস্থা</label>
              <div className="flex flex-wrap gap-2">
                {ROAD_STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setStatus(o.value)}
                    className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-bold transition ${
                      status === o.value
                        ? 'btn-gradient text-white'
                        : 'bg-cream text-ink-soft hover:bg-cream-dark'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink">বিবরণ</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="কী অবস্থা দেখলেন? যেমন: বড় গর্ত হয়েছে, পানি জমে আছে..."
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink">ছবি (ঐচ্ছিক)</label>
              <MediaPicker items={media} onChange={(items) => setMedia(items.slice(0, 1))} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-ink">আপনার নাম (ঐচ্ছিক)</label>
              <input
                value={reporter}
                onChange={(e) => setReporter(e.target.value)}
                placeholder={member ? member.name : 'নাম না দিলে বেনামী হিসেবে যাবে'}
                className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand"
              />
            </div>

            {error && <p className="text-sm font-semibold text-brand">{error}</p>}
            {posted && (
              <p className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-300">
                আপডেট যোগ হয়েছে — রোডের বর্তমান অবস্থা বদলে গেছে।
              </p>
            )}

            <button
              onClick={submit}
              disabled={sending}
              className="flex w-full items-center justify-center gap-2 rounded-2xl btn-gradient py-3.5 font-bold text-white shadow-lg disabled:opacity-60"
            >
              <IconSend className="h-5 w-5" />
              {sending ? 'পাঠানো হচ্ছে...' : 'আপডেট পাঠান'}
            </button>
          </div>
        </section>

        <LoginPromptModal
          open={showLogin}
          onClose={() => {
            setShowLogin(false);
            setPendingPreset(null);
          }}
          returnTo={`/roads/submit?road_id=${road.id}${pendingPreset ? `&preset=${pendingPreset.key}` : ''}`}
        />

        {/* Phase 15 — স্টার রেটিং: রোড/মোড়ের তথ্য কতটা সঠিক */}
        <StarRating targetType={isSpot ? 'spot' : 'road'} targetId={road.id} />

        {/* Live timeline */}
        <section className="rounded-2xl bg-surface border border-white/10 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="mb-4 font-bold text-ink">লাইভ আপডেট টাইমলাইন</h2>
          {road.updates.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-soft">এখনো কোনো আপডেট নেই।</p>
          ) : (
            <ol className="relative space-y-5 border-l-2 border-cream-dark pl-5">
              {road.updates.map((u) => (
                <li key={u.id} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-white ${ROAD_STATUS_DOT[u.status]}`}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <RoadStatusBadge status={u.status} />
                    <span className="flex items-center gap-1 text-xs text-ink-soft">
                      <IconClock className="h-3.5 w-3.5" /> {u.time_ago}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">{u.note}</p>
                  {u.media_url &&
                    (isVideoUrl(u.media_url) ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={u.media_url} controls preload="metadata" className="mt-2 w-full rounded-xl" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.media_url} alt="আপডেটের ছবি" className="mt-2 max-h-56 w-full rounded-xl object-cover" loading="lazy" />
                    ))}
                  <p className="mt-1 text-xs text-ink-soft">
                    — {u.reporter_name || 'বেনামী'} ·{' '}
                    {(u.statuses?.length ? u.statuses : [u.status])
                      .map((s) => ROAD_STATUS_LABEL[s])
                      .join(' · ')}
                    {u.preset_key ? ' · এক-ট্যাপ আপডেট' : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
