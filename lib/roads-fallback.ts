import type { RoadStatus } from './types';

/**
 * Demo-mode data for Phase 4 (roads / road updates).
 * Used when Supabase is not configured or schema-v4 hasn't been run —
 * the same fallback pattern as lib/mock.ts and lib/members-fallback.ts.
 *
 * Seeds: 5 roads in ময়মনসিংহ সদর (division 8 → district 1 → upazila 1 →
 * thana 1; IDs match lib/locations.ts). Update timestamps are RELATIVE to
 * "now" at seed time so the "x আগে" labels always look live.
 * The SQL seed in supabase/schema-v4-roads.sql mirrors this data.
 */

export interface RoadRow {
  id: number;
  name: string;
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
  created_at: string;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const SADAR = { division_id: 8, district_id: 1, upazila_id: 1, thana_id: 1, union_id: null } as const;

export const seedRoads: RoadRow[] = [
  { id: 1, name: 'ব্রিজ রোড', from_place: 'গাঙ্গিনাপাড় মোড়', to_place: 'ব্রহ্মপুত্র ব্রিজ', ...SADAR, created_at: ago(30 * DAY) },
  { id: 2, name: 'গাঙ্গিনাপাড় মোড় – চরপাড়া রোড', from_place: 'গাঙ্গিনাপাড় মোড়', to_place: 'চরপাড়া', ...SADAR, created_at: ago(30 * DAY) },
  { id: 3, name: 'ঢাকা–ময়মনসিংহ মহাসড়ক (শহর অংশ)', from_place: 'শহরের প্রবেশমুখ', to_place: 'চরপাড়া মোড়', ...SADAR, created_at: ago(30 * DAY) },
  { id: 4, name: 'আকুয়া–কেওয়াটখালী রোড', from_place: 'আকুয়া', to_place: 'কেওয়াটখালী', ...SADAR, created_at: ago(30 * DAY) },
  { id: 5, name: 'শম্ভুগঞ্জ রোড', from_place: 'নগর ভবন মোড়', to_place: 'শম্ভুগঞ্জ', ...SADAR, created_at: ago(30 * DAY) },
];

export const seedRoadUpdates: RoadUpdateRow[] = [
  // ব্রিজ রোড — fair → bad → repair (current: মেরামত চলছে)
  { id: 1, road_id: 1, status: 'fair', note: 'কিছু জায়গায় খানাখন্দ আছে, সাবধানে চলাচল করুন', media_url: null, reporter_name: 'মোঃ রফিকুল ইসলাম', created_at: ago(2 * DAY) },
  { id: 2, road_id: 1, status: 'bad', note: 'বিশাল গর্ত, দুর্ঘটনার ঝুঁকি — গতকাল রাতে একটি অটো উল্টে যায়', media_url: null, reporter_name: 'সাব্বির হোসেন', created_at: ago(5 * HOUR) },
  { id: 3, road_id: 1, status: 'repair', note: 'পৌরসভার লোক এসে গর্তে ইট-বালু ফেলছে, মেরামত চলছে', media_url: null, reporter_name: 'নুসরাত জাহান', created_at: ago(1 * HOUR) },
  // গাঙ্গিনাপাড় মোড় – চরপাড়া রোড (current: যানজট)
  { id: 4, road_id: 2, status: 'traffic', note: 'সন্ধ্যায় প্রচণ্ড যানজট, সম্ভব হলে বিকল্প রাস্তা ব্যবহার করুন', media_url: null, reporter_name: 'রাকিবুল ইসলাম', created_at: ago(3 * HOUR) },
  // ঢাকা–ময়মনসিংহ মহাসড়ক, শহর অংশ (current: ভালো)
  { id: 5, road_id: 3, status: 'good', note: 'রাস্তা স্বাভাবিক, যান চলাচল মসৃণ', media_url: null, reporter_name: 'মোঃ তানভীর আহমেদ', created_at: ago(1 * DAY) },
  // আকুয়া–কেওয়াটখালী রোড (current: জলাবদ্ধ)
  { id: 6, road_id: 4, status: 'waterlogged', note: 'বৃষ্টির পানি জমে আছে, কিছু অংশে হাঁটু পানি', media_url: null, reporter_name: 'মোছাঃ শারমিন আক্তার', created_at: ago(6 * HOUR) },
  // শম্ভুগঞ্জ রোড (current: মোটামুটি)
  { id: 7, road_id: 5, status: 'fair', note: 'মোটামুটি ভালো, যান চলাচল কিছুটা ধীরগতি', media_url: null, reporter_name: 'মোঃ আরিফুল ইসলাম', created_at: ago(2 * HOUR) },
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
