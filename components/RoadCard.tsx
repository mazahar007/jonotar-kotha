'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Road, RoadDetail, RoadStatus } from '@/lib/types';
import { ROAD_STATUS_META } from '@/lib/road-status';
import { bnNum } from '@/lib/time';
import { IconClock, IconPin, IconRoute } from './icons';
import { QuickChips } from './QuickChips';
import LoginPromptModal from './LoginPromptModal';
import RoadStatusBadge from './RoadStatusBadge';
import StatusRequestButton from './StatusRequestButton';
import type { Preset } from '@/lib/presets';

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXT.some((e) => clean.endsWith(e));
}

/** Phase 18 — static, non-tappable status badges (home slider: "শুধু দেখা যাবে"). */
function PostedStatusBadges({ statuses }: { statuses: RoadStatus[] }) {
  if (statuses.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="পোস্ট করা অবস্থা">
      {statuses.slice(0, 3).map((s) => (
        <span
          key={s}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${ROAD_STATUS_META[s].badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${ROAD_STATUS_META[s].dot}`} aria-hidden />
          {ROAD_STATUS_META[s].label}
        </span>
      ))}
    </div>
  );
}

export default function RoadCard({
  road: initial,
  /** Phase 18 — false on the home slider: posted statuses show as
   *  display-only badges (no QuickChips, no taps). True on /roads + detail. */
  interactive = true,
}: {
  road: Road;
  interactive?: boolean;
}) {
  const [road, setRoad] = useState<Road>(initial);
  const [showLogin, setShowLogin] = useState(false);
  // Phase 17 — preset tapped while logged out → prefill /roads/submit.
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);

  // Refresh when the parent list refetches (area filter change etc.).
  useEffect(() => {
    setRoad(initial);
  }, [initial]);

  function applyDetail(detail: RoadDetail) {
    const { updates: _updates, ...rest } = detail;
    setRoad(rest);
  }

  const latest = road.latest_update;
  const cover = latest?.media_url && !isVideoUrl(latest.media_url) ? latest.media_url : null;
  const breadcrumb = [road.union_name, road.upazila_name, road.district_name].filter(Boolean) as string[];
  const route = [road.from_place, road.to_place].filter(Boolean).join(' → ');
  const isSpot = road.kind === 'spot';

  return (
    <div className="h-full overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]">
      <Link href={`/roads/${road.id}`} className="block">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-36 w-full object-cover" loading="lazy" />
        )}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-ink">
              {road.name}
              {isSpot && (
                <span className="ml-2 inline-block rounded-full bg-violet-100 px-2 py-0.5 align-middle text-[10px] font-bold text-violet-700">
                  📍 মোড়
                </span>
              )}
            </h3>
            <RoadStatusBadge status={road.current_status} />
          </div>

          {isSpot ? (
            road.locality_name && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <IconPin className="h-4 w-4 shrink-0 text-brand" />
                এলাকা: {road.locality_name}
              </p>
            )
          ) : (
            route && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                <IconRoute className="h-4 w-4 shrink-0 text-brand" />
                {route}
              </p>
            )
          )}

          {latest ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">{latest.note}</p>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">এখনো কোনো আপডেট আসেনি — প্রথম আপডেটটি দিন।</p>
          )}

          <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
            <span className="flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" />
              {latest ? `সর্বশেষ আপডেট: ${latest.time_ago}` : 'আপডেট নেই'}
            </span>
            <span className="font-semibold">{bnNum(road.update_count)}টি আপডেট</span>
          </div>

          {breadcrumb.length > 0 && (
            <p className="mt-2 text-xs font-semibold text-ink-soft">{breadcrumb.join(', ')}</p>
          )}
        </div>
      </Link>

      <div className="space-y-2.5 p-4 pt-3" onClick={(e) => e.preventDefault()}>
        {interactive ? (
          <QuickChips
            roadId={road.id}
            kind={road.kind}
            onUpdated={applyDetail}
            onLoginRequired={(p) => {
              setPendingPreset(p);
              setShowLogin(true);
            }}
          />
        ) : (
          /* Phase 18 — home: display-only posted statuses, no taps. */
          <PostedStatusBadges statuses={road.current_statuses} />
        )}
        <StatusRequestButton roadId={road.id} />
      </div>
      <LoginPromptModal
        open={showLogin}
        onClose={() => {
          setShowLogin(false);
          setPendingPreset(null);
        }}
        returnTo={`/roads/submit?road_id=${road.id}${pendingPreset ? `&preset=${pendingPreset.key}` : ''}`}
      />
    </div>
  );
}
