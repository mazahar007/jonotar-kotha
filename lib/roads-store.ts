import { getSupabase } from './supabase';
import { getDistricts, getUnions, getUpazilas } from './store';
import { roadsDemoDb, type RoadRow, type RoadUpdateRow } from './roads-fallback';
import { timeAgoBn } from './time';
import { ROAD_STATUSES } from './types';
import type { LocationIds, Road, RoadDetail, RoadKind, RoadStatus, RoadUpdate } from './types';

/**
 * Phase 4 data layer: roads + road updates. Phase 5: spots (kind) + presets.
 * Phase 18: multi-status updates (statuses text[], max 3) + member_id on updates.
 * Supabase first (service role); ANY failure (including schema-v4/v5/v18 not
 * yet run) falls back to the in-memory demo store so the app never 500s.
 */

/* ---------- raw rows ---------- */

/** Rows from a pre-v5 database lack kind/locality_name/preset_key — default them. */
function normalizeRoad(r: RoadRow): RoadRow {
  return { ...r, kind: r.kind === 'spot' ? 'spot' : 'road', locality_name: r.locality_name ?? null };
}

/** Keep only known status keys; always returns 1–3 valid statuses. */
export function validStatuses(input: unknown, fallback: RoadStatus): RoadStatus[] {
  const arr = Array.isArray(input) ? input : [input];
  const clean = arr
    .map((s) => String(s))
    .filter((s): s is RoadStatus => (ROAD_STATUSES as string[]).includes(s));
  const deduped = [...new Set(clean)];
  return deduped.length > 0 ? deduped.slice(0, 3) : [fallback];
}

function normalizeUpdate(u: RoadUpdateRow): RoadUpdateRow {
  return {
    ...u,
    preset_key: u.preset_key ?? null,
    statuses: validStatuses(u.statuses, u.status),
    member_id: u.member_id ?? null,
  };
}

export async function getRoadRows(): Promise<RoadRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('roads').select('*').order('id', { ascending: true });
      if (!error && data) return (data as RoadRow[]).map(normalizeRoad);
    } catch {
      /* fall through to demo */
    }
  }
  return [...roadsDemoDb().roads];
}

export async function getRoadUpdateRows(roadId?: number): Promise<RoadUpdateRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      let q = supa.from('road_updates').select('*').order('created_at', { ascending: false });
      if (roadId) q = q.eq('road_id', roadId);
      const { data, error } = await q;
      if (!error && data) return (data as RoadUpdateRow[]).map(normalizeUpdate);
    } catch {
      /* fall through to demo */
    }
  }
  const all = [...roadsDemoDb().updates].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return roadId ? all.filter((u) => u.road_id === roadId) : all;
}

/* ---------- composition ---------- */

function toUpdate(r: RoadUpdateRow): RoadUpdate {
  const n = normalizeUpdate(r);
  return {
    id: n.id,
    road_id: n.road_id,
    status: n.statuses![0],
    statuses: n.statuses!,
    note: n.note,
    media_url: n.media_url,
    reporter_name: n.reporter_name,
    preset_key: n.preset_key,
    member_id: n.member_id ?? null,
    created_at: n.created_at,
    time_ago: timeAgoBn(n.created_at),
  };
}

function compose(road: RoadRow, updatesDesc: RoadUpdateRow[]): Road {
  const mine = updatesDesc.filter((u) => u.road_id === road.id);
  const latest = mine[0] ? normalizeUpdate(mine[0]) : null;
  const statuses = latest ? latest.statuses! : [];
  return {
    ...road,
    current_status: statuses[0] ?? null,
    current_statuses: statuses,
    latest_update: latest ? toUpdate(latest) : null,
    update_count: mine.length,
  };
}

async function attachNames(roads: Road[]): Promise<Road[]> {
  const needs = roads.some((r) => r.union_id || r.upazila_id || r.district_id);
  if (!needs) return roads;
  const [unions, upazilas, districts] = await Promise.all([getUnions(), getUpazilas(), getDistricts()]);
  const unionName = new Map(unions.map((u) => [u.id, u.name_bn]));
  const upazilaName = new Map(upazilas.map((u) => [u.id, u.name_bn]));
  const districtName = new Map(districts.map((d) => [d.id, d.name_bn]));
  return roads.map((r) => ({
    ...r,
    union_name: r.union_id ? unionName.get(r.union_id) ?? null : null,
    upazila_name: r.upazila_id ? upazilaName.get(r.upazila_id) ?? null : null,
    district_name: r.district_id ? districtName.get(r.district_id) ?? null : null,
  }));
}

/** A road matches when every provided filter equals its stored hierarchy. */
function matches(road: RoadRow, f: Partial<LocationIds> & { kind?: RoadKind }): boolean {
  if (f.kind != null && road.kind !== f.kind) return false;
  if (f.division_id != null && road.division_id !== f.division_id) return false;
  if (f.district_id != null && road.district_id !== f.district_id) return false;
  if (f.upazila_id != null && road.upazila_id !== f.upazila_id) return false;
  if (f.thana_id != null && road.thana_id !== f.thana_id) return false;
  if (f.union_id != null && road.union_id !== f.union_id) return false;
  return true;
}

export async function getRoads(
  filters: Partial<LocationIds> & { kind?: RoadKind } = {}
): Promise<Road[]> {
  const [roads, updates] = await Promise.all([getRoadRows(), getRoadUpdateRows()]);
  const composed = roads.filter((r) => matches(r, filters)).map((r) => compose(r, updates));
  // Liveliest first: most recent update on top; roads without updates last.
  composed.sort((a, b) => {
    const ta = a.latest_update?.created_at ?? '';
    const tb = b.latest_update?.created_at ?? '';
    return tb.localeCompare(ta);
  });
  return attachNames(composed);
}

export async function getRoadDetail(id: number): Promise<RoadDetail | null> {
  const roads = await getRoadRows();
  const road = roads.find((r) => r.id === id);
  if (!road) return null;
  const updates = await getRoadUpdateRows(id);
  const [base] = await attachNames([compose(road, updates)]);
  return { ...base, updates: updates.map(toUpdate) };
}

/* ---------- writes ---------- */

export async function createRoadUpdate(
  roadId: number,
  input: {
    status: RoadStatus;
    /** Phase 18 — up to 3; defaults to [status]. */
    statuses?: RoadStatus[];
    note: string;
    media_url: string | null;
    reporter_name: string | null;
    preset_key?: string | null;
    /** Phase 18 — posting member (nullable for legacy). */
    member_id?: number | null;
  }
): Promise<RoadUpdate | null> {
  const roads = await getRoadRows();
  if (!roads.some((r) => r.id === roadId)) return null;
  const statuses = validStatuses(input.statuses ?? [input.status], input.status);
  const row = {
    road_id: roadId,
    status: statuses[0],
    statuses,
    note: input.note,
    media_url: input.media_url,
    reporter_name: input.reporter_name,
    preset_key: input.preset_key ?? null,
    member_id: input.member_id ?? null,
    created_at: new Date().toISOString(),
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const inserted = await insertUpdateRow(supa, row);
      if (inserted) return toUpdate(normalizeUpdate(inserted as unknown as RoadUpdateRow));
    } catch {
      /* fall through to demo */
    }
  }
  const db = roadsDemoDb();
  const demoRow: RoadUpdateRow = { id: db.nextUpdateId++, ...row };
  db.updates.push(demoRow);
  return toUpdate(demoRow);
}

/**
 * Insert a road_updates row. Phase 18 adds `statuses` + `member_id` columns;
 * if the Supabase schema hasn't been migrated yet (pre-v18), retry with the
 * legacy column set so the update still persists instead of silently
 * falling back to the in-memory demo store.
 */
async function insertUpdateRow(
  supa: NonNullable<ReturnType<typeof getSupabase>>,
  row: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const attempt = async (r: Record<string, unknown>) => {
    const { data, error } = await supa.from('road_updates').insert(r).select().single();
    if (error) throw error;
    return data as Record<string, unknown>;
  };
  try {
    return await attempt(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Postgres "column does not exist" → pre-v18 schema: retry legacy.
    if (/statuses|member_id/.test(msg) && /column|does not exist/i.test(msg)) {
      const { statuses: _s, member_id: _m, ...legacy } = row;
      try {
        return await attempt(legacy);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export interface RoadInput {
  name: string;
  kind: RoadKind;
  locality_name: string | null;
  from_place: string | null;
  to_place: string | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
}

export async function createRoad(input: RoadInput): Promise<RoadRow> {
  const row = { ...input, created_at: new Date().toISOString() };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('roads').insert(row).select().single();
      if (!error && data) return normalizeRoad(data as RoadRow);
    } catch {
      /* fall through to demo */
    }
  }
  const db = roadsDemoDb();
  const demoRow: RoadRow = { id: db.nextRoadId++, ...row };
  db.roads.push(demoRow);
  return demoRow;
}

export async function updateRoad(id: number, patch: Partial<RoadInput>): Promise<RoadRow | null> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('roads').update(patch).eq('id', id).select().single();
      if (!error && data) return normalizeRoad(data as RoadRow);
    } catch {
      /* fall through to demo */
    }
  }
  const db = roadsDemoDb();
  const r = db.roads.find((x) => x.id === id);
  if (!r) return null;
  Object.assign(r, patch);
  return r;
}

export async function deleteRoad(id: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('roads').delete().eq('id', id);
      if (!error) return true;
    } catch {
      /* fall through to demo */
    }
  }
  const db = roadsDemoDb();
  const before = db.roads.length;
  db.roads = db.roads.filter((r) => r.id !== id);
  db.updates = db.updates.filter((u) => u.road_id !== id);
  return db.roads.length < before;
}

export async function deleteRoadUpdate(roadId: number, updateId: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('road_updates').delete().eq('id', updateId).eq('road_id', roadId);
      if (!error) return true;
    } catch {
      /* fall through to demo */
    }
  }
  const db = roadsDemoDb();
  const before = db.updates.length;
  db.updates = db.updates.filter((u) => !(u.id === updateId && u.road_id === roadId));
  return db.updates.length < before;
}
