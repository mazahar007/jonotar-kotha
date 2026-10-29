import { getSupabase } from './supabase';

/**
 * Phase 21aj — site settings: the last hardcoded site content, now
 * manageable from the admin panel (/admin → সেটিংস). Supabase first;
 * ANY failure falls back to an in-memory demo store seeded with the
 * current live values, so the site never breaks — same pattern as
 * lib/otp.ts and lib/store.ts. NOTE: like all other data, settings edits
 * persist across deploys only once Supabase is connected.
 */

export interface EmergencyNumber {
  name: string;
  number: string;
}

export interface SiteSettings {
  site_name: string;
  hero_badge: string;
  hero_line1: string;
  hero_line2: string;
  hero_line3: string;
  hero_subtext: string;
  hero_pills: string[];
  emergency_numbers: EmergencyNumber[];
}

/** Exact values currently hardcoded on the live site — the visual default. */
export const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'জনতার কথা',
  hero_badge: 'সেবা চালু আছে আপনার এলাকায়',
  hero_line1: 'জনতার কথা',
  hero_line2: 'আপনার এলাকার',
  hero_line3: 'ডিজিটাল প্ল্যাটফর্ম',
  hero_subtext:
    'সমস্যা জানান, রোডের অবস্থা দেখুন, জরুরি SOS — সব এক অ্যাপে। গ্রাম থেকে শহর, আমরা আছি সবখানে।',
  hero_pills: ['বেনামী রিপোর্ট', 'লাইভ SOS', 'সম্পূর্ণ ফ্রি', 'রোড আপডেট'],
  emergency_numbers: [
    { name: 'জাতীয় জরুরি সেবা', number: '999' },
    { name: 'নারী নির্যাতন প্রতিরোধ', number: '109' },
    { name: 'সরকারি তথ্য ও সেবা', number: '333' },
  ],
};

const STRING_KEYS = [
  'site_name',
  'hero_badge',
  'hero_line1',
  'hero_line2',
  'hero_line3',
  'hero_subtext',
] as const;

const JSON_KEYS = ['hero_pills', 'emergency_numbers'] as const;

const g = globalThis as unknown as { __jkSettings?: Record<string, string> };

function demoStore(): Record<string, string> {
  if (!g.__jkSettings) g.__jkSettings = {};
  return g.__jkSettings;
}

function mergeSettings(raw: Record<string, string>): SiteSettings {
  const out: SiteSettings = { ...DEFAULT_SETTINGS, emergency_numbers: [...DEFAULT_SETTINGS.emergency_numbers], hero_pills: [...DEFAULT_SETTINGS.hero_pills] };
  for (const k of STRING_KEYS) {
    const v = raw[k];
    if (typeof v === 'string' && v !== '') out[k] = v;
  }
  try {
    const pills = raw.hero_pills ? JSON.parse(raw.hero_pills) : null;
    if (Array.isArray(pills) && pills.every((p) => typeof p === 'string') && pills.length > 0) {
      out.hero_pills = pills;
    }
  } catch {
    /* keep default */
  }
  try {
    const nums = raw.emergency_numbers ? JSON.parse(raw.emergency_numbers) : null;
    if (
      Array.isArray(nums) &&
      nums.length > 0 &&
      nums.every((n) => n && typeof n.name === 'string' && typeof n.number === 'string' && n.number !== '')
    ) {
      out.emergency_numbers = nums.map((n) => ({ name: n.name, number: n.number }));
    }
  } catch {
    /* keep default */
  }
  return out;
}

export async function getSettings(): Promise<SiteSettings> {
  const raw: Record<string, string> = {};
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('settings').select('key, value');
      if (!error && data) {
        for (const row of data as { key: string; value: string }[]) raw[row.key] = row.value;
      } else {
        throw new Error('settings read failed');
      }
    } catch {
      /* fall through to demo store */
    }
  }
  if (Object.keys(raw).length === 0) Object.assign(raw, demoStore());
  return mergeSettings(raw);
}

/** Admin write path. Only known keys are accepted; unknown keys are dropped. */
export async function updateSettings(patch: Record<string, unknown>): Promise<SiteSettings> {
  const rows: { key: string; value: string }[] = [];
  for (const k of STRING_KEYS) {
    if (typeof patch[k] === 'string') rows.push({ key: k, value: patch[k] as string });
  }
  for (const k of JSON_KEYS) {
    if (patch[k] !== undefined) rows.push({ key: k, value: JSON.stringify(patch[k]) });
  }
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
    } catch {
      /* fall through to demo store */
    }
  }
  const store = demoStore();
  for (const r of rows) store[r.key] = r.value;
  return getSettings();
}
