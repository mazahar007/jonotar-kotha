import Link from 'next/link';
import type { Road } from '@/lib/types';
import { bnNum } from '@/lib/time';
import { IconClock, IconRoute } from './icons';
import RoadStatusBadge from './RoadStatusBadge';

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXT.some((e) => clean.endsWith(e));
}

export default function RoadCard({ road }: { road: Road }) {
  const latest = road.latest_update;
  const cover = latest?.media_url && !isVideoUrl(latest.media_url) ? latest.media_url : null;
  const breadcrumb = [road.union_name, road.upazila_name, road.district_name].filter(Boolean) as string[];
  const route = [road.from_place, road.to_place].filter(Boolean).join(' → ');

  return (
    <Link
      href={`/roads/${road.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition hover:shadow-[0_4px_18px_rgba(0,0,0,0.09)]"
    >
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="h-36 w-full object-cover" loading="lazy" />
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 flex-1 text-[15px] font-bold leading-snug text-ink">{road.name}</h3>
          <RoadStatusBadge status={road.current_status} />
        </div>

        {route && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
            <IconRoute className="h-4 w-4 shrink-0 text-brand" />
            {route}
          </p>
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
  );
}
