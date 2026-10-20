import { ROAD_STATUS_LABEL, type RoadStatus } from './types';

/**
 * Phase 5 — the ONE shared place for road-status presentation meta:
 * Bengali label + badge colors + timeline dot color for every status key.
 * Used by RoadStatusBadge, quick-update chips, the detail timeline and
 * the explorer summary. (Labels themselves live in lib/types.ts next to
 * the ROAD_STATUS_OPTIONS list and are re-used from there.)
 */

export interface RoadStatusMeta {
  label: string;
  /** Tailwind classes for the pill badge. */
  badge: string;
  /** Tailwind classes for the timeline dot. */
  dot: string;
  /** Blink the small dot in the badge (urgent conditions). */
  alert?: boolean;
}

export const ROAD_STATUS_META: Record<RoadStatus, RoadStatusMeta> = {
  good: { label: ROAD_STATUS_LABEL.good, badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  fair: { label: ROAD_STATUS_LABEL.fair, badge: 'bg-amber-200 text-amber-900', dot: 'bg-amber-400' },
  bad: { label: ROAD_STATUS_LABEL.bad, badge: 'bg-red-100 text-red-700', dot: 'bg-red-500', alert: true },
  repair: { label: ROAD_STATUS_LABEL.repair, badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  traffic: { label: ROAD_STATUS_LABEL.traffic, badge: 'bg-orange-100 text-orange-800', dot: 'bg-orange-500' },
  traffic_light: { label: ROAD_STATUS_LABEL.traffic_light, badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  waterlogged: { label: ROAD_STATUS_LABEL.waterlogged, badge: 'bg-sky-100 text-sky-800', dot: 'bg-sky-500' },
  closed: { label: ROAD_STATUS_LABEL.closed, badge: 'bg-stone-900 text-white', dot: 'bg-stone-900', alert: true },
  incident: { label: ROAD_STATUS_LABEL.incident, badge: 'bg-red-100 text-red-800', dot: 'bg-red-600', alert: true },
  accident: { label: ROAD_STATUS_LABEL.accident, badge: 'bg-red-600 text-white', dot: 'bg-red-700', alert: true },
  power_out: { label: ROAD_STATUS_LABEL.power_out, badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
  power_back: { label: ROAD_STATUS_LABEL.power_back, badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  gas_out: { label: ROAD_STATUS_LABEL.gas_out, badge: 'bg-rose-100 text-rose-800', dot: 'bg-rose-500' },
  gas_back: { label: ROAD_STATUS_LABEL.gas_back, badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  water_out: { label: ROAD_STATUS_LABEL.water_out, badge: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  water_back: { label: ROAD_STATUS_LABEL.water_back, badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
};

export function roadStatusMeta(status: RoadStatus): RoadStatusMeta {
  return ROAD_STATUS_META[status];
}
