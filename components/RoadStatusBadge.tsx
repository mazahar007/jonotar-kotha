import type { RoadStatus } from '@/lib/types';
import { ROAD_STATUS_LABEL } from '@/lib/types';

export const ROAD_STATUS_STYLES: Record<RoadStatus, string> = {
  good: 'bg-emerald-100 text-emerald-800',
  fair: 'bg-amber-200 text-amber-900',
  bad: 'bg-red-100 text-red-700',
  repair: 'bg-blue-100 text-blue-800',
  traffic: 'bg-orange-100 text-orange-800',
  waterlogged: 'bg-sky-100 text-sky-800',
  closed: 'bg-stone-900 text-white',
};

/** Timeline dot color per status (detail page). */
export const ROAD_STATUS_DOT: Record<RoadStatus, string> = {
  good: 'bg-emerald-500',
  fair: 'bg-amber-400',
  bad: 'bg-red-500',
  repair: 'bg-blue-500',
  traffic: 'bg-orange-500',
  waterlogged: 'bg-sky-500',
  closed: 'bg-stone-900',
};

export default function RoadStatusBadge({
  status,
  size = 'sm',
}: {
  status: RoadStatus | null;
  size?: 'sm' | 'lg';
}) {
  const cls = size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-2.5 py-1 text-xs';
  if (!status) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-stone-100 font-bold text-stone-500 ${cls}`}>
        আপডেট নেই
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${ROAD_STATUS_STYLES[status]} ${cls}`}>
      {(status === 'bad' || status === 'closed') && (
        <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {ROAD_STATUS_LABEL[status]}
    </span>
  );
}
