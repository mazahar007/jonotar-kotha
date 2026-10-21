import { getSupabase } from './supabase';

/**
 * Phase 9 data layer: emergency broadcasts (জরুরি ঘোষণা).
 * Supabase first; ANY failure (including schema-v9 not yet run) falls back
 * to the in-memory demo store seeded with 1 active + 1 expired demo
 * broadcast — the same pattern as lib/report-comments.ts, so the app
 * never 500s without Supabase.
 *
 * Area matching: a broadcast is relevant to a user area when EVERY
 * non-null scope level of the broadcast equals the user's level.
 * All-null scope = nationwide (matches everywhere).
 */

export interface BroadcastRow {
  id: number;
  title: string;
  body: string;
  scope_division_id: number | null;
  scope_district_id: number | null;
  scope_upazila_id: number | null;
  scope_thana_id: number | null;
  expires_at: string;
  created_by: string | null;
  created_at: string;
}

export interface AreaScope {
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id?: number | null;
}

/* ---------- demo store (globalThis, survives module reloads) ---------- */

const HOUR_MS = 3_600_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

const g = globalThis as unknown as {
  __jkBroadcasts?: BroadcastRow[];
  __jkBroadcastSeq?: number;
};

function seedDemo(): void {
  if (g.__jkBroadcasts) return;
  // Seed area ids follow supabase/schema-v2-locations.sql insert order:
  // বিভাগ ময়মনসিংহ = 8, জেলা ময়মনসিংহ = 1, উপজেলা ময়মনসিংহ সদর = 1.
  g.__jkBroadcasts = [
    {
      id: 1,
      title: '⚠️ বন্যা সতর্কতা — ময়মনসিংহ সদর',
      body: 'ব্রহ্মপুত্রের পানি বিপদসীমার কাছাকাছি। নদী তীরবর্তী এলাকার বাসিন্দারা সতর্ক থাকুন, জরুরি নম্বর ৯৯৯ সংরক্ষণ করুন। পৌরসভা কন্ট্রোল রুম খোলা আছে।',
      scope_division_id: 8,
      scope_district_id: 1,
      scope_upazila_id: 1,
      scope_thana_id: null,
      expires_at: ahead(20 * HOUR_MS),
      created_by: 'admin',
      created_at: ago(4 * HOUR_MS),
    },
    {
      id: 2,
      title: 'রাত ১০টার পর সড়ক মেরামত — গাঙ্গিনাপাড়',
      body: 'গাঙ্গিনাপাড় সড়কে রাত ১০টা থেকে ভোর ৫টা পর্যন্ত মেরামত চলবে। বিকল্প রাস্তা ব্যবহার করুন।',
      scope_division_id: null,
      scope_district_id: null,
      scope_upazila_id: null,
      scope_thana_id: null,
      expires_at: ago(26 * HOUR_MS),
      created_by: 'admin',
      created_at: ago(30 * HOUR_MS),
    },
  ];
  g.__jkBroadcastSeq = 3;
}

function demoBroadcasts(): BroadcastRow[] {
  seedDemo();
  return g.__jkBroadcasts!;
}

function isActive(b: BroadcastRow): boolean {
  return new Date(b.expires_at).getTime() > Date.now();
}

export function matchesArea(b: BroadcastRow, area: AreaScope): boolean {
  const pairs: [number | null, number | null][] = [
    [b.scope_division_id, area.division_id],
    [b.scope_district_id, area.district_id],
    [b.scope_upazila_id, area.upazila_id],
    [b.scope_thana_id, area.thana_id],
  ];
  return pairs.every(([scope, user]) => scope == null || (user != null && scope === user));
}

/* ---------- reads ---------- */

async function listRows(): Promise<BroadcastRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('emergency_broadcasts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) return data as BroadcastRow[];
      /* any error (table missing etc.) → demo */
    } catch {
      /* fall through */
    }
  }
  return [...demoBroadcasts()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/** Active broadcasts only, optionally filtered to a user's area.
 * Without an area, only nationwide broadcasts (all scope levels null)
 * are returned — a scoped broadcast never leaks into the wrong area. */
export async function getActiveBroadcasts(area?: AreaScope): Promise<BroadcastRow[]> {
  const rows = (await listRows()).filter(isActive);
  if (!area) {
    const nationwide: AreaScope = {
      division_id: null,
      district_id: null,
      upazila_id: null,
      thana_id: null,
    };
    return rows.filter((b) => matchesArea(b, nationwide));
  }
  return rows.filter((b) => matchesArea(b, area));
}

/** All broadcasts incl. expired (admin list). */
export async function getAllBroadcasts(): Promise<BroadcastRow[]> {
  return listRows();
}

export async function getBroadcast(id: number): Promise<BroadcastRow | null> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('emergency_broadcasts')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return data as BroadcastRow;
      if (error && error.code !== 'PGRST116') {
        /* table missing etc. — fall through to demo */
      } else {
        return null;
      }
    } catch {
      /* fall through */
    }
  }
  return demoBroadcasts().find((b) => b.id === id) ?? null;
}

/* ---------- writes (admin) ---------- */

export interface BroadcastInput {
  title: string;
  body: string;
  scope: AreaScope;
  expires_at: string;
  created_by?: string | null;
}

export async function createBroadcast(input: BroadcastInput): Promise<BroadcastRow> {
  const row = {
    title: input.title,
    body: input.body,
    scope_division_id: input.scope.division_id ?? null,
    scope_district_id: input.scope.district_id ?? null,
    scope_upazila_id: input.scope.upazila_id ?? null,
    scope_thana_id: input.scope.thana_id ?? null,
    expires_at: input.expires_at,
    created_by: input.created_by ?? 'admin',
    created_at: new Date().toISOString(),
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('emergency_broadcasts').insert(row).select().single();
      if (!error && data) return data as BroadcastRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoBroadcasts();
  const demoRow: BroadcastRow = { id: g.__jkBroadcastSeq!++, ...row };
  db.push(demoRow);
  return demoRow;
}

export async function deleteBroadcast(id: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('emergency_broadcasts').delete().eq('id', id);
      if (!error) return true;
    } catch {
      /* fall through to demo */
    }
  }
  const before = demoBroadcasts().length;
  g.__jkBroadcasts = demoBroadcasts().filter((b) => b.id !== id);
  return g.__jkBroadcasts!.length < before;
}
