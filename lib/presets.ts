import type { RoadStatus } from './types';

/**
 * Phase 5 — এক-ক্লিক কুইক আপডেট catalog.
 * Every preset posts an update IMMEDIATELY (no typing): the preset's label
 * doubles as the default note text, and `preset_key` is stored on the
 * update row so preset posts are distinguishable from typed updates.
 */

export interface Preset {
  key: string;
  /** Chip text AND default note posted with the update. */
  label: string;
  /** Shorter chip text for compact card rows (defaults to label). */
  short?: string;
  status: RoadStatus;
  group: string;
}

export const PRESET_GROUPS: { title: string; presets: Preset[] }[] = [
  {
    title: 'যানজট',
    presets: [
      { key: 'heavy_traffic', label: 'জ্যাম বেশি', status: 'traffic', group: 'যানজট' },
      { key: 'light_traffic', label: 'হালকা জ্যাম', status: 'traffic_light', group: 'যানজট' },
      { key: 'no_traffic', label: 'জ্যাম নেই', status: 'good', group: 'যানজট' },
    ],
  },
  {
    title: 'ঘটনা',
    presets: [
      { key: 'incident', label: 'ঝামেলা চলতেছে', short: 'ঝামেলা', status: 'incident', group: 'ঘটনা' },
      { key: 'accident', label: 'দুর্ঘটনা ঘটেছে', short: 'দুর্ঘটনা', status: 'accident', group: 'ঘটনা' },
      { key: 'road_closed', label: 'রাস্তা বন্ধ আছে', short: 'বন্ধ আছে', status: 'closed', group: 'ঘটনা' },
    ],
  },
  {
    title: 'বিদ্যুৎ · গ্যাস · পানি',
    presets: [
      { key: 'power_out', label: 'এখন বিদ্যুৎ নাই', short: 'বিদ্যুৎ নাই', status: 'power_out', group: 'বিদ্যুৎ · গ্যাস · পানি' },
      { key: 'power_back', label: 'বিদ্যুৎ এসেছে', status: 'power_back', group: 'বিদ্যুৎ · গ্যাস · পানি' },
      { key: 'gas_out', label: 'গ্যাস নাই', status: 'gas_out', group: 'বিদ্যুৎ · গ্যাস · পানি' },
      { key: 'gas_back', label: 'গ্যাস এসেছে', status: 'gas_back', group: 'বিদ্যুৎ · গ্যাস · পানি' },
      { key: 'water_out', label: 'পানি নাই', status: 'water_out', group: 'বিদ্যুৎ · গ্যাস · পানি' },
      { key: 'water_back', label: 'পানি এসেছে', status: 'water_back', group: 'বিদ্যুৎ · গ্যাস · পানি' },
    ],
  },
  {
    title: 'রোড অবস্থা',
    presets: [
      { key: 'road_bad', label: 'রাস্তা ভাঙা', status: 'bad', group: 'রোড অবস্থা' },
      { key: 'road_repair', label: 'মেরামত চলছে', status: 'repair', group: 'রোড অবস্থা' },
      { key: 'waterlogged', label: 'জলাবদ্ধ', status: 'waterlogged', group: 'রোড অবস্থা' },
      { key: 'water_cleared', label: 'পানি নেমে গেছে', status: 'fair', group: 'রোড অবস্থা' },
      { key: 'all_normal', label: 'সব স্বাভাবিক', status: 'good', group: 'রোড অবস্থা' },
    ],
  },
];

export const PRESETS: Preset[] = PRESET_GROUPS.flatMap((g) => g.presets);

export function presetByKey(key: string): Preset | undefined {
  return PRESETS.find((p) => p.key === key);
}

function pick(keys: string[]): Preset[] {
  return keys.map((k) => presetByKey(k)).filter((p): p is Preset => Boolean(p));
}

/** Compact chip row shown on SPOT cards. */
export const QUICK_CHIPS_SPOT: Preset[] = pick([
  'heavy_traffic',
  'light_traffic',
  'incident',
  'power_out',
  'all_normal',
]);

/** Compact chip row shown on ROAD cards. */
export const QUICK_CHIPS_ROAD: Preset[] = pick([
  'heavy_traffic',
  'light_traffic',
  'road_bad',
  'road_repair',
  'waterlogged',
  'all_normal',
]);
