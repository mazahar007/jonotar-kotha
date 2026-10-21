import { ROAD_STATUS_META } from '@/lib/road-status';
import type { RoadStatus } from '@/lib/types';
import { ROAD_STATUS_LABEL } from '@/lib/types';

/** Badge classes per status — sourced from the shared meta in lib/road-status.ts. */
export const ROAD_STATUS_STYLES: Record<RoadStatus, string> = Object.fromEntries(
  Object.entries(ROAD_STATUS_META).map(([k, v]) => [k, v.badge])
) as Record<RoadStatus, string>;

/** Timeline dot color per status (detail page) — from the shared meta. */
export const ROAD_STATUS_DOT: Record<RoadStatus, string> = Object.fromEntries(
  Object.entries(ROAD_STATUS_META).map(([k, v]) => [k, v.dot])
) as Record<RoadStatus, string>;

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
      <span className={`inline-flex items-center gap-1 rounded-full bg-white/5 font-bold text-ink-soft ${cls}`}>
        আপডেট নেই
      </span>
    );
  }
  const meta = ROAD_STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold ${meta.badge} ${cls}`}>
      {meta.alert && <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />}
      {ROAD_STATUS_LABEL[status]}
    </span>
  );
}
