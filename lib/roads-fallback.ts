import type { RoadStatus } from './types';

/**
 * Demo-mode data for Phase 4 (roads / road updates).
 * Used when Supabase is not configured or schema-v4 hasn't been run —
 * the same fallback pattern as lib/mock.ts and lib/members-fallback.ts.
 *
 * Seeds: 5 roads + 6 গুরুত্বপূর্ণ স্থান/মোড় (Phase 5) in ময়মনসিংহ সদর
 * (division 8 → district 1 → upazila 1 → thana 1; IDs match lib/locations.ts).
 * Update timestamps are RELATIVE to "now" at seed time so the "x আগে"
 * labels always look live.
 * The SQL seeds in supabase/schema-v4-roads.sql + schema-v5-spots.sql mirror this data.
 */

export interface RoadRow {
  id: number;
  name: string;
  /** Phase 5 — 'road' | 'spot' (গুরুত্বপূর্ণ স্থান/মোড়). */
  kind: 'road' | 'spot';
  /** Phase 5 — এলাকার নাম for spots; null for roads. */
  locality_name: string | null;
  from_place: string | null;
  to_place: string | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
  created_at: string;
}

export interface RoadUpdateRow {
  id: number;
  road_id: number;
  status: RoadStatus;
  note: string;
  media_url: string | null;
  reporter_name: string | null;
  /** Phase 5 — preset key when posted via a one-tap chip; null for typed updates. */
  preset_key: string | null;
  created_at: string;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const SADAR = { division_id: 8, district_id: 1, upazila_id: 1, thana_id: 1, union_id: null } as const;

export const seedRoads: RoadRow[] = [
  { id: 1, name: 'ব্রিজ রোড', kind: 'road', locality_name: null, from_place: 'গাঙ্গিনাপাড় মোড়', to_place: 'ব্রহ্মপুত্র ব্রিজ', ...SADAR, created_at: ago(30 * DAY) },
  { id: 2, name: 'গাঙ্গিনাপাড় মোড় – চরপাড়া রোড', kind: 'road', locality_name: null, from_place: 'গাঙ্গিনাপাড় মোড়', to_place: 'চরপাড়া', ...SADAR, created_at: ago(30 * DAY) },
  { id: 3, name: 'ঢাকা–ময়মনসিংহ মহাসড়ক (শহর অংশ)', kind: 'road', locality_name: null, from_place: 'শহরের প্রবেশমুখ', to_place: 'চরপাড়া মোড়', ...SADAR, created_at: ago(30 * DAY) },
  { id: 4, name: 'আকুয়া–কেওয়াটখালী রোড', kind: 'road', locality_name: null, from_place: 'আকুয়া', to_place: 'কেওয়াটখালী', ...SADAR, created_at: ago(30 * DAY) },
  { id: 5, name: 'শম্ভুগঞ্জ রোড', kind: 'road', locality_name: null, from_place: 'নগর ভবন মোড়', to_place: 'শম্ভুগঞ্জ', ...SADAR, created_at: ago(30 * DAY) },
  // Phase 5 — গুরুত্বপূর্ণ স্থান / মোড় (spots), কোতোয়ালী মডেল থানা, union NULL (city area)
  { id: 6, name: 'চরপাড়া মোড়', kind: 'spot', locality_name: 'চরপাড়া', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
  { id: 7, name: 'নতুন বাজার', kind: 'spot', locality_name: 'নতুন বাজার', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
  { id: 8, name: 'জিলা স্কুল মোড়', kind: 'spot', locality_name: 'জিলা স্কুল', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
  { id: 9, name: 'ব্রিজ মোড়', kind: 'spot', locality_name: 'ব্রিজ', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
  { id: 10, name: 'গাঙ্গিনাপাড় মোড়', kind: 'spot', locality_name: 'গাঙ্গিনাপাড়', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
  { id: 11, name: 'টাউন হল মোড়', kind: 'spot', locality_name: 'টাউন হল', from_place: null, to_place: null, ...SADAR, created_at: ago(30 * DAY) },
];

export const seedRoadUpdates: RoadUpdateRow[] = [
  // ব্রিজ রোড — fair → bad → repair (current: মেরামত চলছে)
  { id: 1, road_id: 1, status: 'fair', note: 'কিছু জায়গায় খানাখন্দ আছে, সাবধানে চলাচল করুন', media_url: null, reporter_name: 'মোঃ রফিকুল ইসলাম', preset_key: null, created_at: ago(2 * DAY) },
  { id: 2, road_id: 1, status: 'bad', note: 'বিশাল গর্ত, দুর্ঘটনার ঝুঁকি — গতকাল রাতে একটি অটো উল্টে যায়', media_url: null, reporter_name: 'সাব্বির হোসেন', preset_key: null, created_at: ago(5 * HOUR) },
  { id: 3, road_id: 1, status: 'repair', note: 'পৌরসভার লোক এসে গর্তে ইট-বালু ফেলছে, মেরামত চলছে', media_url: null, reporter_name: 'নুসরাত জাহান', preset_key: null, created_at: ago(1 * HOUR) },
  // গাঙ্গিনাপাড় মোড় – চরপাড়া রোড (current: যানজট)
  { id: 4, road_id: 2, status: 'traffic', note: 'সন্ধ্যায় প্রচণ্ড যানজট, সম্ভব হলে বিকল্প রাস্তা ব্যবহার করুন', media_url: null, reporter_name: 'রাকিবুল ইসলাম', preset_key: null, created_at: ago(3 * HOUR) },
  // ঢাকা–ময়মনসিংহ মহাসড়ক, শহর অংশ (current: ভালো)
  { id: 5, road_id: 3, status: 'good', note: 'রাস্তা স্বাভাবিক, যান চলাচল মসৃণ', media_url: null, reporter_name: 'মোঃ তানভীর আহমেদ', preset_key: null, created_at: ago(1 * DAY) },
  // আকুয়া–কেওয়াটখালী রোড (current: জলাবদ্ধ)
  { id: 6, road_id: 4, status: 'waterlogged', note: 'বৃষ্টির পানি জমে আছে, কিছু অংশে হাঁটু পানি', media_url: null, reporter_name: 'মোছাঃ শারমিন আক্তার', preset_key: null, created_at: ago(6 * HOUR) },
  // শম্ভুগঞ্জ রোড (current: মোটামুটি)
  { id: 7, road_id: 5, status: 'fair', note: 'মোটামুটি ভালো, যান চলাচল কিছুটা ধীরগতি', media_url: null, reporter_name: 'মোঃ আরিফুল ইসলাম', preset_key: null, created_at: ago(2 * HOUR) },
  // ---- Phase 5 spot seeds (posted as one-tap presets) ----
  // চরপাড়া মোড় (current: জ্যাম বেশি)
  { id: 8, road_id: 6, status: 'traffic', note: 'চরপাড়া মোড়ে জ্যাম বেশি', media_url: null, reporter_name: 'সাব্বির হোসেন', preset_key: 'heavy_traffic', created_at: ago(35 * MIN) },
  // নতুন বাজার (current: সব স্বাভাবিক)
  { id: 9, road_id: 7, status: 'good', note: 'সব স্বাভাবিক', media_url: null, reporter_name: 'রাকিবুল ইসলাম', preset_key: 'all_normal', created_at: ago(1 * HOUR) },
  // জিলা স্কুল মোড় (current: বিদ্যুৎ নাই)
  { id: 10, road_id: 8, status: 'power_out', note: 'এলাকায় এখন বিদ্যুৎ নাই', media_url: null, reporter_name: 'নুসরাত জাহান', preset_key: 'power_out', created_at: ago(20 * MIN) },
  // ব্রিজ মোড় (current: হালকা জ্যাম)
  { id: 11, road_id: 9, status: 'traffic_light', note: 'হালকা জ্যাম', media_url: null, reporter_name: 'মোঃ আরিফুল ইসলাম', preset_key: 'light_traffic', created_at: ago(2 * HOUR) },
  // গাঙ্গিনাপাড় মোড় — হালকা জ্যাম (৩ ঘণ্টা আগে) → ঝামেলা চলতেছে (current)
  { id: 12, road_id: 10, status: 'traffic_light', note: 'হালকা জ্যাম', media_url: null, reporter_name: 'মোঃ তানভীর আহমেদ', preset_key: 'light_traffic', created_at: ago(3 * HOUR) },
  { id: 13, road_id: 10, status: 'incident', note: 'ঝামেলা চলতেছে', media_url: null, reporter_name: 'মোছাঃ শারমিন আক্তার', preset_key: 'incident', created_at: ago(50 * MIN) },
  // টাউন হল মোড় (current: সব স্বাভাবিক)
  { id: 14, road_id: 11, status: 'good', note: 'সব স্বাভাবিক', media_url: null, reporter_name: 'মোঃ রফিকুল ইসলাম', preset_key: 'all_normal', created_at: ago(4 * HOUR) },
];

/* ---------- In-memory demo store (survives module reloads via globalThis) ---------- */

export interface RoadsDemoDb {
  roads: RoadRow[];
  updates: RoadUpdateRow[];
  nextRoadId: number;
  nextUpdateId: number;
}

const g = globalThis as unknown as { __jkRoadsDb?: RoadsDemoDb };

export function roadsDemoDb(): RoadsDemoDb {
  if (!g.__jkRoadsDb) {
    const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    g.__jkRoadsDb = {
      roads: clone(seedRoads),
      updates: clone(seedRoadUpdates),
      nextRoadId: seedRoads.length + 1,
      nextUpdateId: seedRoadUpdates.length + 1,
    };
  }
  return g.__jkRoadsDb;
}
