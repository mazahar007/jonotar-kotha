import { getSupabase } from './supabase';
import { getDistricts, getDivisions, getThanas, getUnions, getUpazilas } from './store';
import { demoDb, type MemberRow, type SurveyResponseRow, type SurveyRow } from './members-fallback';
import type {
  AmarElakaData,
  LocationIds,
  Member,
  Survey,
  SurveyBreakdown,
  SurveyResults,
  SurveyTargetLevel,
  SurveyWithState,
} from './types';

/**
 * Phase 3 data layer: members, surveys, responses.
 * Supabase first (service role); any failure falls back to the in-memory
 * demo store so the app never 500s before schema-v3 has been run.
 */

/* ---------- row <-> domain ---------- */

function ids(r: MemberRow, p: 'home' | 'current'): LocationIds {
  return {
    division_id: r[`${p}_division_id`],
    district_id: r[`${p}_district_id`],
    upazila_id: r[`${p}_upazila_id`],
    thana_id: r[`${p}_thana_id`],
    union_id: r[`${p}_union_id`],
  };
}

export function rowToMember(r: MemberRow): Member {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? null,
    email: r.email ?? null,
    phone_verified: r.phone_verified ?? false,
    email_verified: r.email_verified ?? false,
    account_status: r.account_status ?? 'unverified',
    points: r.points ?? 0,
    badges: r.badges ?? [],
    show_on_leaderboard: r.show_on_leaderboard !== false,
    home: ids(r, 'home'),
    current: ids(r, 'current'),
    is_visible: r.is_visible,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

function flat(prefix: 'home' | 'current', v: LocationIds) {
  return {
    [`${prefix}_division_id`]: v.division_id,
    [`${prefix}_district_id`]: v.district_id,
    [`${prefix}_upazila_id`]: v.upazila_id,
    [`${prefix}_thana_id`]: v.thana_id,
    [`${prefix}_union_id`]: v.union_id,
  };
}

/* ---------- location name resolution ---------- */

interface NameMaps {
  division: Map<number, string>;
  district: Map<number, string>;
  upazila: Map<number, string>;
  thana: Map<number, string>;
  union: Map<number, string>;
}

export async function locationNameMaps(): Promise<NameMaps> {
  const [divs, dists, ups, ths, uns] = await Promise.all([
    getDivisions(),
    getDistricts(),
    getUpazilas(),
    getThanas(),
    getUnions(),
  ]);
  const m = <T extends { id: number; name_bn: string }>(rows: T[]) =>
    new Map(rows.map((r) => [r.id, r.name_bn]));
  return { division: m(divs), district: m(dists), upazila: m(ups), thana: m(ths), union: m(uns) };
}

/** "(ইউনিয়ন/থানা,) উপজেলা, জেলা" — the breadcrumb used across the app. */
export function breadcrumb(v: LocationIds, maps: NameMaps): string {
  const parts: string[] = [];
  const local = v.union_id ? maps.union.get(v.union_id) : v.thana_id ? maps.thana.get(v.thana_id) : null;
  if (local) parts.push(local);
  if (v.upazila_id && maps.upazila.get(v.upazila_id)) parts.push(maps.upazila.get(v.upazila_id)!);
  if (v.district_id && maps.district.get(v.district_id)) parts.push(maps.district.get(v.district_id)!);
  if (parts.length === 0 && v.division_id && maps.division.get(v.division_id)) {
    parts.push(maps.division.get(v.division_id)!);
  }
  return parts.join(', ');
}

/* ---------- members ---------- */

export async function getAllMemberRows(): Promise<MemberRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('members').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as MemberRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return [...demoDb().members];
}

export async function getMemberRowById(id: number): Promise<MemberRow | null> {
  const all = await getAllMemberRows();
  return all.find((m) => m.id === id) ?? null;
}

export async function getMemberRowByPhone(phone: string): Promise<MemberRow | null> {
  const all = await getAllMemberRows();
  return all.find((m) => m.phone === phone) ?? null;
}

export async function getMemberRowByEmail(email: string): Promise<MemberRow | null> {
  const all = await getAllMemberRows();
  const e = email.toLowerCase();
  return all.find((m) => (m.email ?? '').toLowerCase() === e) ?? null;
}

export async function createMemberRow(input: {
  name: string;
  phone: string;
  home: LocationIds;
  current: LocationIds;
  is_visible: boolean;
}): Promise<MemberRow> {
  const now = new Date().toISOString();
  const row = {
    name: input.name,
    phone: input.phone,
    ...(flat('home', input.home) as object),
    ...(flat('current', input.current) as object),
    is_visible: input.is_visible,
    created_at: now,
    updated_at: now,
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('members').insert(row).select().single();
      if (!error && data) return data as MemberRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const demoRow: MemberRow = { id: db.nextMemberId++, ...(row as object) } as MemberRow;
  db.members.unshift(demoRow);
  return demoRow;
}

/* ---------- Phase 13 auth members (OTP-based, phone and/or email) ---------- */

/** Create a member via the OTP register flow (phone optional, email optional). */
export async function createAuthMemberRow(input: {
  name: string;
  phone: string | null;
  email: string | null;
}): Promise<MemberRow> {
  const now = new Date().toISOString();
  const row = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    phone_verified: false,
    email_verified: false,
    account_status: 'unverified' as const,
    points: 0,
    badges: [] as string[],
    home_division_id: null,
    home_district_id: null,
    home_upazila_id: null,
    home_thana_id: null,
    home_union_id: null,
    current_division_id: null,
    current_district_id: null,
    current_upazila_id: null,
    current_thana_id: null,
    current_union_id: null,
    is_visible: true,
    // Phase 15: leaderboard opt-in defaults to true.
    show_on_leaderboard: true,
    created_at: now,
    updated_at: now,
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('members').insert(row).select().single();
      if (!error && data) return data as MemberRow;
      /* fall through to demo (e.g. schema-v13 columns not run yet) */
    } catch {
      /* fall through */
    }
  }
  const db = demoDb();
  const demoRow: MemberRow = { id: db.nextMemberId++, ...row };
  db.members.unshift(demoRow);
  return demoRow;
}

/**
 * Apply OTP verification results to a member.
 * The user's exact rule: phone verified → account_status='verified';
 * email-only verified → stays 'unverified' until a phone is verified.
 */
export async function markChannelVerified(
  id: number,
  channel: 'sms' | 'email',
  phone?: string | null
): Promise<MemberRow | null> {
  const row = await getMemberRowById(id);
  if (!row) return null;
  const phoneVerified = channel === 'sms' ? true : (row.phone_verified ?? false);
  const emailVerified = channel === 'email' ? true : (row.email_verified ?? false);
  const dbPatch: Record<string, unknown> = {
    phone_verified: phoneVerified,
    email_verified: emailVerified,
    // user's exact rule: verified status requires a verified phone
    account_status: phoneVerified ? 'verified' : 'unverified',
    updated_at: new Date().toISOString(),
  };
  if (phone) dbPatch.phone = phone;

  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('members').update(dbPatch).eq('id', id).select().single();
      if (!error && data) return data as MemberRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const m = db.members.find((x) => x.id === id);
  if (!m) return null;
  Object.assign(m, dbPatch);
  return m;
}

export async function updateMemberRow(
  id: number,
  patch: Partial<{ name: string; is_visible: boolean; show_on_leaderboard: boolean; current: LocationIds }>
): Promise<MemberRow | null> {
  const dbRow: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.name !== undefined) dbRow.name = patch.name;
  if (patch.is_visible !== undefined) dbRow.is_visible = patch.is_visible;
  if (patch.show_on_leaderboard !== undefined) dbRow.show_on_leaderboard = patch.show_on_leaderboard;
  if (patch.current) Object.assign(dbRow, flat('current', patch.current));

  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('members').update(dbRow).eq('id', id).select().single();
      if (!error && data) return data as MemberRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const m = db.members.find((x) => x.id === id);
  if (!m) return null;
  Object.assign(m, dbRow);
  return m;
}

/* ---------- surveys ---------- */

export async function getSurveyRows(onlyActive = false): Promise<SurveyRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      let q = supa.from('surveys').select('*').order('created_at', { ascending: false });
      if (onlyActive) q = q.eq('status', 'active');
      const { data, error } = await q;
      if (!error && data) return data as SurveyRow[];
    } catch {
      /* fall through to demo */
    }
  }
  const all = [...demoDb().surveys].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return onlyActive ? all.filter((s) => s.status === 'active') : all;
}

export async function getSurveyRow(id: number): Promise<SurveyRow | null> {
  const all = await getSurveyRows();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSurveyRow(input: {
  question: string;
  options: string[];
  target_level: SurveyTargetLevel;
  target_id: number | null;
}): Promise<SurveyRow> {
  const row = { ...input, status: 'active' as const, created_at: new Date().toISOString() };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('surveys').insert(row).select().single();
      if (!error && data) return data as SurveyRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const demoRow: SurveyRow = { id: db.nextSurveyId++, ...row };
  db.surveys.unshift(demoRow);
  return demoRow;
}

export async function updateSurveyRow(
  id: number,
  patch: Partial<{ question: string; options: string[]; status: 'active' | 'closed'; target_level: SurveyTargetLevel; target_id: number | null }>
): Promise<SurveyRow | null> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('surveys').update(patch).eq('id', id).select().single();
      if (!error && data) return data as SurveyRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const s = db.surveys.find((x) => x.id === id);
  if (!s) return null;
  Object.assign(s, patch);
  return s;
}

export async function deleteSurveyRow(id: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('surveys').delete().eq('id', id);
      if (!error) return true;
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  const before = db.surveys.length;
  db.surveys = db.surveys.filter((s) => s.id !== id);
  db.responses = db.responses.filter((r) => r.survey_id !== id);
  return db.surveys.length < before;
}

/* ---------- responses ---------- */

export async function getResponseRows(surveyId: number): Promise<SurveyResponseRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('survey_responses').select('*').eq('survey_id', surveyId);
      if (!error && data) return data as SurveyResponseRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return demoDb().responses.filter((r) => r.survey_id === surveyId);
}

export async function addResponseRow(
  survey: SurveyRow,
  member: MemberRow,
  optionIndex: number
): Promise<{ ok: true } | { ok: false; reason: 'already' | 'invalid' }> {
  if (optionIndex < 0 || optionIndex >= survey.options.length) return { ok: false, reason: 'invalid' };
  const row = {
    survey_id: survey.id,
    member_id: member.id,
    option_index: optionIndex,
    home_thana_id: member.home_thana_id,
    home_union_id: member.home_union_id,
    created_at: new Date().toISOString(),
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('survey_responses').insert(row);
      if (!error) return { ok: true };
      if ((error as { code?: string }).code === '23505') return { ok: false, reason: 'already' };
      // Table missing etc. — fall through to the demo store.
    } catch {
      /* fall through to demo */
    }
  }
  const db = demoDb();
  if (db.responses.some((r) => r.survey_id === survey.id && r.member_id === member.id)) {
    return { ok: false, reason: 'already' };
  }
  db.responses.push({ id: db.nextResponseId++, ...row });
  return { ok: true };
}

/* ---------- survey logic ---------- */

export function memberInScope(member: Member, s: SurveyRow): boolean {
  switch (s.target_level) {
    case 'all':
      return true;
    case 'division':
      return member.home.division_id === s.target_id;
    case 'district':
      return member.home.district_id === s.target_id;
    case 'upazila':
      return member.home.upazila_id === s.target_id;
    case 'thana':
      return member.home.thana_id === s.target_id;
    case 'union':
      return member.home.union_id === s.target_id;
  }
}

export function targetLabel(s: SurveyRow, maps: NameMaps): string {
  if (s.target_level === 'all' || s.target_id == null) return 'সারা দেশ';
  const name =
    s.target_level === 'division'
      ? maps.division.get(s.target_id)
      : s.target_level === 'district'
        ? maps.district.get(s.target_id)
        : s.target_level === 'upazila'
          ? maps.upazila.get(s.target_id)
          : s.target_level === 'thana'
            ? maps.thana.get(s.target_id)
            : maps.union.get(s.target_id);
  const suffix = {
    division: 'বিভাগ',
    district: 'জেলা',
    upazila: 'উপজেলা',
    thana: 'থানা',
    union: 'ইউনিয়ন',
  }[s.target_level];
  return name ? `${name} ${suffix}` : 'সারা দেশ';
}

export function rowToSurvey(s: SurveyRow, maps: NameMaps): Survey {
  return {
    id: s.id,
    question: s.question,
    options: s.options,
    target_level: s.target_level,
    target_id: s.target_id,
    target_label: targetLabel(s, maps),
    status: s.status,
    created_at: s.created_at,
  };
}

export function computeResults(s: SurveyRow, responses: SurveyResponseRow[]): SurveyResults {
  const counts = s.options.map(() => 0);
  for (const r of responses) if (r.option_index >= 0 && r.option_index < counts.length) counts[r.option_index]++;
  const total = responses.length;
  return {
    total,
    per_option: s.options.map((option, i) => ({
      option,
      count: counts[i],
      pct: total ? Math.round((counts[i] / total) * 100) : 0,
    })),
  };
}

export function computeBreakdown(s: SurveyRow, responses: SurveyResponseRow[], maps: NameMaps): SurveyBreakdown {
  const build = (key: 'home_thana_id' | 'home_union_id', names: Map<number, string>) => {
    const groups = new Map<string, { name: string; total: number; per_option: number[] }>();
    for (const r of responses) {
      const id = r[key];
      const name = id != null ? (names.get(id) ?? 'অন্যান্য') : 'থানা/ইউনিয়ন অনির্ধারিত';
      const g = groups.get(name) ?? { name, total: 0, per_option: s.options.map(() => 0) };
      g.total++;
      if (r.option_index >= 0 && r.option_index < g.per_option.length) g.per_option[r.option_index]++;
      groups.set(name, g);
    }
    return [...groups.values()].sort((a, b) => b.total - a.total);
  };
  return {
    by_thana: build('home_thana_id', maps.thana),
    by_union: build('home_union_id', maps.union),
  };
}

/* ---------- আমার এলাকার মানুষ ---------- */

/** True when `cur` sits inside the home area, compared at home's deepest known level. */
function isAtHome(home: LocationIds, cur: LocationIds): boolean {
  if (home.union_id != null) return cur.union_id === home.union_id;
  if (home.thana_id != null) return cur.thana_id === home.thana_id;
  if (home.upazila_id != null) return cur.upazila_id === home.upazila_id;
  if (home.district_id != null) return cur.district_id === home.district_id;
  return cur.division_id === home.division_id;
}

/** True when two current locations are the same area (compared at a's deepest level). */
function sameCurrentArea(a: LocationIds, b: LocationIds): boolean {
  if (a.union_id != null) return b.union_id === a.union_id;
  if (a.thana_id != null) return b.thana_id === a.thana_id;
  if (a.upazila_id != null) return b.upazila_id === a.upazila_id;
  if (a.district_id != null) return b.district_id === a.district_id;
  return b.division_id === a.division_id;
}

function isPeer(me: Member, other: Member): boolean {
  if (me.home.thana_id != null) return other.home.thana_id === me.home.thana_id;
  return other.home.upazila_id === me.home.upazila_id;
}

export async function computeAmarElaka(me: Member): Promise<AmarElakaData> {
  const [rows, maps] = await Promise.all([getAllMemberRows(), locationNameMaps()]);
  const members = rows.map(rowToMember);
  const areaMembers = members.filter((m) => isPeer(me, m));
  const peers = areaMembers.filter((m) => m.id !== me.id);

  const atHome = areaMembers.filter((m) => isAtHome(m.home, m.current)).length;
  const awayMembers = areaMembers.filter((m) => !isAtHome(m.home, m.current));
  const iAmAway = !isAtHome(me.home, me.current);

  const away_list = awayMembers
    .filter((m) => m.id !== me.id && m.is_visible)
    .map((m) => ({ id: m.id, name: m.name, current_breadcrumb: breadcrumb(m.current, maps) }));

  const near_me = iAmAway
    ? peers
        .filter((m) => m.is_visible && sameCurrentArea(me.current, m.current))
        .map((m) => ({ id: m.id, name: m.name, current_breadcrumb: breadcrumb(m.current, maps) }))
    : [];

  return {
    area_label: breadcrumb(me.home, maps),
    total: areaMembers.length,
    at_home: atHome,
    away: awayMembers.length,
    away_list,
    near_me,
    my_current_breadcrumb: breadcrumb(me.current, maps),
    i_am_away: iAmAway,
  };
}

export async function getMemberStats() {  const [rows, maps] = await Promise.all([getAllMemberRows(), locationNameMaps()]);
  const byDistrict = new Map<number, number>();
  for (const r of rows) {
    if (r.home_district_id != null) byDistrict.set(r.home_district_id, (byDistrict.get(r.home_district_id) ?? 0) + 1);
  }
  return {
    total: rows.length,
    by_district: [...byDistrict.entries()]
      .map(([id, count]) => ({ district_id: id, name: maps.district.get(id) ?? 'অন্যান্য', count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Full survey payload for one requester: scope, my vote, results, admin breakdown. */
export async function surveyWithState(
  s: SurveyRow,
  member: Member | null,
  maps: NameMaps,
  opts?: { admin?: boolean }
): Promise<SurveyWithState> {
  const responses = await getResponseRows(s.id);
  const myVote = member ? (responses.find((r) => r.member_id === member.id)?.option_index ?? null) : null;
  const showResults = opts?.admin || myVote !== null || s.status === 'closed';
  const base: SurveyWithState = {
    ...rowToSurvey(s, maps),
    my_vote: myVote,
    in_scope: member ? memberInScope(member, s) : null,
    results: showResults ? computeResults(s, responses) : null,
  };
  if (opts?.admin) base.breakdown = computeBreakdown(s, responses, maps);
  return base;
}

export function normalizePhone(raw: unknown): string {
  return String(raw ?? '').replace(/[\s-]/g, '');
}
