'use client';

import { useEffect, useRef, useState } from 'react';
import { useMember } from '@/lib/member';
import {
  PRESET_GROUPS,
  QUICK_CHIPS_ROAD,
  QUICK_CHIPS_SPOT,
  type Preset,
} from '@/lib/presets';
import { ROAD_STATUS_META } from '@/lib/road-status';
import type { RoadDetail, RoadKind } from '@/lib/types';

/**
 * Phase 5 — এক-ক্লিক কুইক আপডেট.
 * Tapping a preset chip posts the update IMMEDIATELY (preset status +
 * preset label as the note + preset_key). The POST returns the refreshed
 * road detail, which the parent applies in place; a small "আপডেট হয়েছে ✓"
 * note confirms the tap (no confirm dialog — true one-click).
 */

function usePresetPost(roadId: number, onUpdated?: (detail: RoadDetail) => void) {
  const { member } = useMember();
  const [postingKey, setPostingKey] = useState<string | null>(null);
  const [justPosted, setJustPosted] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function post(preset: Preset) {
    if (postingKey) return;
    setPostingKey(preset.key);
    setFailed(false);
    try {
      const res = await fetch(`/api/roads/${roadId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: preset.status,
          note: preset.label,
          preset_key: preset.key,
          reporter_name: member?.name || '',
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('failed');
      if (data && typeof data === 'object' && 'updates' in data) {
        onUpdated?.(data as RoadDetail);
      }
      setJustPosted(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustPosted(false), 2600);
    } catch {
      setFailed(true);
    } finally {
      setPostingKey(null);
    }
  }

  return { post, postingKey, justPosted, failed };
}

function Chip({
  preset,
  posting,
  disabled,
  onTap,
}: {
  preset: Preset;
  posting: boolean;
  disabled: boolean;
  onTap: () => void;
}) {
  const dot = ROAD_STATUS_META[preset.status].dot;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onTap();
      }}
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#efe3d3] bg-cream px-3 py-2 text-xs font-bold text-ink transition hover:bg-cream-dark disabled:opacity-50"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {posting ? 'যাচ্ছে...' : preset.short ?? preset.label}
    </button>
  );
}

function Feedback({ justPosted, failed }: { justPosted: boolean; failed: boolean }) {
  if (justPosted)
    return <span className="text-[11px] font-bold text-emerald-700">আপডেট হয়েছে ✓</span>;
  if (failed) return <span className="text-[11px] font-bold text-brand">পাঠানো যায়নি, আবার চেষ্টা করুন</span>;
  return null;
}

/** Compact one-tap chip row used on road/spot cards. */
export function QuickChips({
  roadId,
  kind,
  onUpdated,
}: {
  roadId: number;
  kind: RoadKind;
  onUpdated?: (detail: RoadDetail) => void;
}) {
  const { post, postingKey, justPosted, failed } = usePresetPost(roadId, onUpdated);
  const presets = kind === 'spot' ? QUICK_CHIPS_SPOT : QUICK_CHIPS_ROAD;
  return (
    <div onClick={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-bold text-ink-soft">এক ট্যাপে জানান:</span>
        {presets.map((p) => (
          <Chip
            key={p.key}
            preset={p}
            posting={postingKey === p.key}
            disabled={postingKey !== null}
            onTap={() => post(p)}
          />
        ))}
        <Feedback justPosted={justPosted} failed={failed} />
      </div>
    </div>
  );
}

/** Full grouped preset panel used on the detail page, above the manual form. */
export function QuickPresetPanel({
  roadId,
  onUpdated,
}: {
  roadId: number;
  onUpdated?: (detail: RoadDetail) => void;
}) {
  const { post, postingKey, justPosted, failed } = usePresetPost(roadId, onUpdated);
  return (
    <div className="space-y-3">
      {PRESET_GROUPS.map((g) => (
        <div key={g.title}>
          <p className="mb-1.5 text-xs font-bold text-ink-soft">{g.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {g.presets.map((p) => (
              <button
                key={p.key}
                type="button"
                disabled={postingKey !== null}
                onClick={() => post(p)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[#efe3d3] bg-cream px-3.5 py-2 text-xs font-bold text-ink transition hover:bg-cream-dark disabled:opacity-50"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ROAD_STATUS_META[p.status].dot}`} />
                {postingKey === p.key ? 'যাচ্ছে...' : p.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Feedback justPosted={justPosted} failed={failed} />
    </div>
  );
}
