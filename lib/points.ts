import { getSupabase } from './supabase';
import { demoDb, type MemberRow } from './members-fallback';

/**
 * Phase 15 — 🏆 পয়েন্ট, ব্যাজ, লাইক, রেটিং ইঞ্জিন।
 * Supabase first; ANY failure (including schema-v15 not yet run) falls back
 * to in-memory demo stores — the same pattern as lib/report-comments.ts, so
 * the app never 500s.
 *
 * ── পয়েন্ট নিয়ম (brief + schema-v15-points.sql-এ ডকুমেন্টেড) ──
 *  1. প্রতিটি কাজে +১: রিপোর্ট পোস্ট, মন্তব্য, লাইক দেওয়া, ভেরিফাই ভোট,
 *     রেটিং দেওয়া, রোড আপডেট, জরিপে ভোট।
 *  2. Idempotency: একই (member, ref_type, ref_id)-এর জন্য দুবার পয়েন্ট নয় —
 *     award() লেজারে একই ref আছে কিনা দেখে তারপর দেয়। ভেরিফাই/জরিপ ভোট
 *     এমনিতেই প্রতি সদস্যে একবার, তবু লেজার-চেক ডাবল-সুরক্ষা দেয়।
 *  3. নিষ্ক্রিয়তা (inactivity): যেকোনো লগ-ইন করা কাজের সময়
 *     last_active_at থেকে ৪৮ঘণ্টা বা তার বেশি পার হলে প্রতি ৪৮ঘণ্টায়
 *     ৫ পয়েন্ট কাটা যায় (মোট পয়েন্ট শূন্যের নিচে নামে না);
 *     প্রতিটি লগ-ইন করা কাজে last_active_at আপডেট হয়।
 *     → এই নিয়ম touchActivity() ইমপ্লিমেন্ট করে; award() প্রতিবার প্রথমে
 *     একে ডাকে। "নিষ্ক্রিয়তা" reason-সহ লেজারে −৫ রো বসে।
 *  4. ব্যাজ: প্রতি ১০০ পয়েন্ট পার হলেই স্বয়ংক্রিয়ভাবে ব্যাজ মেলে, ১০০০
 *     পর্যন্ত (BADGE_TIERS — এডিটেবল কনস্ট্যান্ট)। UI টোস্ট দেখায়:
 *     "🏆 নতুন ব্যাজ!"।
 *
 * award() কখনো throw করে না — মূল অ্যাকশন (রিপোর্ট/কমেন্ট/ভোট) পয়েন্টের
 * কারণে ভাঙা চলবে না; ভেতরে try/catch।
 */

/* ---------- action catalog (editable) ---------- */

export type PointAction =
  | 'report_post'
  | 'comment'
  | 'like'
  | 'verify'
  | 'rating'
  | 'road_update'
  | 'survey_vote';

export const POINT_REASONS: Record<PointAction, string> = {
  report_post: 'রিপোর্ট পোস্ট',
  comment: 'মন্তব্য',
  like: 'লাইক',
  verify: 'ভেরিফাই ভোট',
  rating: 'রেটিং',
  road_update: 'রোড আপডেট',
  survey_vote: 'জরিপে ভোট',
};

export const INACTIVITY_REASON = 'নিষ্ক্রিয়তা';

/** Badge tiers — [threshold, name]. Edit freely; award logic stays the same. */
export const BADGE_TIERS: Array<[number, string]> = [
  [100, '🌱 অবদানকারী'],
  [200, '⭐ সক্রিয় নাগরিক'],
  [300, '🔥 এলাকার মুখ'],
  [400, '💎 বিশ্বস্ত সদস্য'],
  [500, '🏅 কমিউনিটি হিরো'],
  [600, '🚀 পরিবর্তনের দূত'],
  [700, '👑 এলাকার নেতা'],
  [800, '💫 জনতার তারকা'],
  [900, '🌟 মহান অবদানকারী'],
  [1000, '🏆 জনতার চ্যাম্পিয়ন'],
];

/* ---------- row types ---------- */

export interface LedgerEntry {
  id: number;
  member_id: number;
  delta: number;
  reason: string;
  ref_type: string | null;
  ref_id: string | null;
  created_at: string;
}

export interface LikeRow {
  id: number;
  member_id: number;
  target_type: 'report' | 'comment';
  target_id: string;
  created_at: string;
}

export interface RatingRow {
  id: number;
  member_id: number;
  target_type: 'road' | 'spot';
  target_id: string;
  stars: number;
  created_at: string;
}

interface MemberPoints {
  id: number;
  name: string;
  points: number;
  badges: string[];
  last_active_at: string | null;
}

/* ---------- member read/write (supa → demo) ---------- */

async function readMember(id: number): Promise<MemberPoints | null> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('members')
        .select('id,name,points,badges,last_active_at')
        .eq('id', id)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name ?? '',
          points: data.points ?? 0,
          badges: Array.isArray(data.badges) ? data.badges : [],
          last_active_at: data.last_active_at ?? null,
        };
      }
    } catch {
      /* fall through to demo */
    }
  }
  const m = demoDb().members.find((x) => x.id === id);
  if (!m) return null;
  return {
    id: m.id,
    name: m.name,
    points: m.points ?? 0,
    badges: m.badges ?? [],
    last_active_at: m.last_active_at ?? null,
  };
}

async function persistMember(id: number, patch: { points?: number; badges?: string[]; last_active_at?: string }): Promise<void> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('members').update(patch).eq('id', id);
      if (!error) return;
    } catch {
      /* fall through to demo */
    }
  }
  const m = demoDb().members.find((x) => x.id === id);
  if (m) Object.assign(m, patch);
}

/* ---------- ledger (supa → demo) ---------- */

const g = globalThis as unknown as {
  __jkLedger?: LedgerEntry[];
  __jkLikes?: LikeRow[];
  __jkRatings?: RatingRow[];
  __jkPointsSeq?: number;
  __jkSeeded15?: boolean;
};

function demoLedger(): LedgerEntry[] {
  if (!g.__jkLedger) {
    g.__jkLedger = [];
    g.__jkPointsSeq = 1;
  }
  return g.__jkLedger!;
}

/** Demo seed: member 1 shows a non-empty profile (points + 1 badge + earn/spend rows). */
function ensureDemoSeed(): void {
  if (g.__jkSeeded15) return;
  g.__jkSeeded15 = true;
  const db = demoDb();
  const m = db.members.find((x) => x.id === 1);
  if (!m || m.points !== 0) return; // already touched — leave it alone
  const now = Date.now();
  const iso = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000).toISOString();
  const ledger = demoLedger();
  const earnReasons: PointAction[] = ['report_post', 'comment', 'like', 'verify', 'rating', 'road_update', 'survey_vote'];
  let seq = g.__jkPointsSeq!;
  for (let i = 0; i < 110; i++) {
    const action = earnReasons[i % earnReasons.length];
    ledger.push({
      id: seq++,
      member_id: 1,
      delta: 1,
      reason: POINT_REASONS[action],
      ref_type: 'seed',
      ref_id: `seed:${i}`,
      created_at: iso(400 - i * 3),
    });
  }
  ledger.push({
    id: seq++,
    member_id: 1,
    delta: -5,
    reason: INACTIVITY_REASON,
    ref_type: 'inactivity',
    ref_id: 'seed-inactivity',
    created_at: iso(60),
  });
  g.__jkPointsSeq = seq;
  m.points = 105; // 110 − 5
  m.badges = [BADGE_TIERS[0][1]]; // 🌱 অবদানকারী
  m.last_active_at = new Date(now).toISOString();
}

async function insertLedger(entry: Omit<LedgerEntry, 'id' | 'created_at'>): Promise<void> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('point_ledger').insert({
        member_id: entry.member_id,
        delta: entry.delta,
        reason: entry.reason,
        ref_type: entry.ref_type,
        ref_id: entry.ref_id,
      });
      if (!error) return;
    } catch {
      /* fall through to demo */
    }
  }
  ensureDemoSeed();
  const ledger = demoLedger();
  ledger.push({ ...entry, id: g.__jkPointsSeq!++, created_at: new Date().toISOString() });
}

async function hasLedgerRef(memberId: number, refType: string, refId: string): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('point_ledger')
        .select('id')
        .eq('member_id', memberId)
        .eq('ref_type', refType)
        .eq('ref_id', refId)
        .limit(1);
      if (!error) return (data?.length ?? 0) > 0;
    } catch {
      /* fall through to demo */
    }
  }
  ensureDemoSeed();
  return demoLedger().some((e) => e.member_id === memberId && e.ref_type === refType && e.ref_id === refId);
}

export async function getLedger(memberId: number, filter?: 'earn' | 'spend'): Promise<LedgerEntry[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('point_ledger')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        let rows = data as LedgerEntry[];
        if (filter === 'earn') rows = rows.filter((r) => r.delta > 0);
        if (filter === 'spend') rows = rows.filter((r) => r.delta < 0);
        return rows;
      }
    } catch {
      /* fall through to demo */
    }
  }
  ensureDemoSeed();
  let rows = demoLedger()
    .filter((e) => e.member_id === memberId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  if (filter === 'earn') rows = rows.filter((r) => r.delta > 0);
  if (filter === 'spend') rows = rows.filter((r) => r.delta < 0);
  return rows;
}

/* ---------- inactivity penalty ---------- */

const INACTIVITY_WINDOW_MS = 48 * 3600 * 1000; // ৪৮ ঘণ্টা
const INACTIVITY_DEDUCT_PER_WINDOW = 5; // প্রতি ৪৮ঘণ্টায় ৫ পয়েন্ট

/**
 * নিষ্ক্রিয়তা নিয়ম: যেকোনো লগ-ইন করা কাজের সময় last_active_at থেকে
 * ৪৮ঘণ্টা+ পার হলে ৫ × floor(ঘণ্টা/৪৮) পয়েন্ট কাটা (শূন্যের নিচে নয়)।
 * প্রতিটি লগ-ইন করা কাজে last_active_at আপডেট হয়।
 */
export async function touchActivity(memberId: number): Promise<{ deducted: number; points: number }> {
  try {
    const row = await readMember(memberId);
    if (!row) return { deducted: 0, points: 0 };
    const nowIso = new Date().toISOString();
    let deducted = 0;
    if (row.last_active_at) {
      const idleMs = Date.now() - new Date(row.last_active_at).getTime();
      if (idleMs >= INACTIVITY_WINDOW_MS) {
        const windows = Math.floor(idleMs / INACTIVITY_WINDOW_MS);
        deducted = Math.min(INACTIVITY_DEDUCT_PER_WINDOW * windows, row.points);
        if (deducted > 0) {
          await insertLedger({
            member_id: memberId,
            delta: -deducted,
            reason: INACTIVITY_REASON,
            ref_type: 'inactivity',
            ref_id: nowIso.slice(0, 10),
          });
        }
      }
    }
    const points = Math.max(0, row.points - deducted);
    await persistMember(memberId, { points, last_active_at: nowIso });
    return { deducted, points };
  } catch {
    return { deducted: 0, points: 0 };
  }
}

/* ---------- badges ---------- */

/** Tiers crossed when moving oldPoints → newPoints that aren't held yet. */
export function newlyCrossedTiers(oldPoints: number, newPoints: number, held: string[]): string[] {
  const out: string[] = [];
  for (const [threshold, name] of BADGE_TIERS) {
    if (oldPoints < threshold && newPoints >= threshold && !held.includes(name)) out.push(name);
  }
  return out;
}

async function maybeAwardBadges(memberId: number, oldPoints: number, newPoints: number, held: string[]): Promise<string[]> {
  const fresh = newlyCrossedTiers(oldPoints, newPoints, held);
  if (fresh.length > 0) {
    await persistMember(memberId, { badges: [...held, ...fresh] });
  }
  return fresh;
}

/* ---------- award ---------- */

export interface AwardResult {
  awarded: boolean;
  deducted: number;
  points: number;
  newBadges: string[];
}

/**
 * এক কাজের জন্য +১ পয়েন্ট। ref দিলে (ref_type, ref_id) একই হলে দ্বিতীয়বার
 * দেয় না — ভেরিফাই/জরিপ/রেটিং/লাইকের "একবারই" নিয়ম এখানেই নিশ্চিত।
 * প্রতিবার প্রথমে touchActivity() (নিষ্ক্রিয়তা কাটা + last_active_at আপডেট)।
 */
export async function award(
  memberId: number,
  action: PointAction,
  ref?: { refType: string; refId: string }
): Promise<AwardResult> {
  try {
    const touch = await touchActivity(memberId);
    const row = await readMember(memberId);
    if (!row) return { awarded: false, deducted: touch.deducted, points: touch.points, newBadges: [] };

    if (ref && (await hasLedgerRef(memberId, ref.refType, ref.refId))) {
      // আগেই এই ref-এর পয়েন্ট দেওয়া হয়েছে — দ্বিতীয়বার নয়।
      return { awarded: false, deducted: touch.deducted, points: touch.points, newBadges: [] };
    }

    await insertLedger({
      member_id: memberId,
      delta: 1,
      reason: POINT_REASONS[action],
      ref_type: ref?.refType ?? null,
      ref_id: ref?.refId ?? null,
    });
    const oldPoints = touch.points;
    const newPoints = oldPoints + 1;
    const newBadges = await maybeAwardBadges(memberId, oldPoints, newPoints, row.badges);
    await persistMember(memberId, { points: newPoints, last_active_at: new Date().toISOString() });
    return { awarded: true, deducted: touch.deducted, points: newPoints, newBadges };
  } catch {
    return { awarded: false, deducted: 0, points: 0, newBadges: [] };
  }
}

/* ---------- likes (supa → demo) ---------- */

function demoLikes(): LikeRow[] {
  if (!g.__jkLikes) g.__jkLikes = [];
  return g.__jkLikes!;
}

export async function getLikeState(
  memberId: number | null,
  targetType: 'report' | 'comment',
  targetId: string
): Promise<{ liked: boolean; count: number }> {
  const supa = getSupabase();
  if (supa) {
    try {
      const [countRes, mineRes] = await Promise.all([
        supa.from('likes').select('id', { count: 'exact', head: true }).eq('target_type', targetType).eq('target_id', targetId),
        memberId != null
          ? supa.from('likes').select('id').eq('member_id', memberId).eq('target_type', targetType).eq('target_id', targetId).limit(1)
          : Promise.resolve({ data: [], error: null } as const),
      ]);
      if (!countRes.error) {
        return { liked: (mineRes.data?.length ?? 0) > 0, count: countRes.count ?? 0 };
      }
    } catch {
      /* fall through to demo */
    }
  }
  const rows = demoLikes().filter((l) => l.target_type === targetType && l.target_id === targetId);
  return {
    liked: memberId != null && rows.some((l) => l.member_id === memberId),
    count: rows.length,
  };
}

export async function toggleLike(
  memberId: number,
  targetType: 'report' | 'comment',
  targetId: string
): Promise<{ liked: boolean; count: number }> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data: existing } = await supa
        .from('likes')
        .select('id')
        .eq('member_id', memberId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .limit(1);
      if (existing && existing.length > 0) {
        await supa.from('likes').delete().eq('id', existing[0].id);
      } else {
        const { error } = await supa
          .from('likes')
          .insert({ member_id: memberId, target_type: targetType, target_id: targetId });
        if (error && error.code !== '23505') {
          /* fall through to demo */
        } else {
          return getLikeState(memberId, targetType, targetId);
        }
      }
      return getLikeState(memberId, targetType, targetId);
    } catch {
      /* fall through to demo */
    }
  }
  const store = demoLikes();
  const idx = store.findIndex(
    (l) => l.member_id === memberId && l.target_type === targetType && l.target_id === targetId
  );
  if (idx >= 0) {
    store.splice(idx, 1);
  } else {
    store.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      member_id: memberId,
      target_type: targetType,
      target_id: targetId,
      created_at: new Date().toISOString(),
    });
  }
  return getLikeState(memberId, targetType, targetId);
}

/* ---------- ratings (supa → demo) ---------- */

function demoRatings(): RatingRow[] {
  if (!g.__jkRatings) g.__jkRatings = [];
  return g.__jkRatings!;
}

async function ratingAggregate(
  targetType: 'road' | 'spot',
  targetId: string
): Promise<{ average: number | null; count: number }> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('ratings')
        .select('stars')
        .eq('target_type', targetType)
        .eq('target_id', targetId);
      if (!error && data) {
        const rows = data as { stars: number }[];
        const count = rows.length;
        return {
          average: count ? Math.round((rows.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : null,
          count,
        };
      }
    } catch {
      /* fall through to demo */
    }
  }
  const rows = demoRatings().filter((r) => r.target_type === targetType && r.target_id === targetId);
  const count = rows.length;
  return {
    average: count ? Math.round((rows.reduce((s, r) => s + r.stars, 0) / count) * 10) / 10 : null,
    count,
  };
}

export async function getRatingState(
  memberId: number | null,
  targetType: 'road' | 'spot',
  targetId: string
): Promise<{ myStars: number | null; average: number | null; count: number }> {
  let myStars: number | null = null;
  const supa = getSupabase();
  if (supa && memberId != null) {
    try {
      const { data, error } = await supa
        .from('ratings')
        .select('stars')
        .eq('member_id', memberId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .limit(1);
      if (!error && data && data.length > 0) myStars = (data[0] as { stars: number }).stars;
    } catch {
      /* fall through to demo */
    }
  } else if (memberId != null) {
    const mine = demoRatings().find(
      (r) => r.member_id === memberId && r.target_type === targetType && r.target_id === targetId
    );
    if (mine) myStars = mine.stars;
  }
  const agg = await ratingAggregate(targetType, targetId);
  return { myStars, ...agg };
}

/**
 * রেটিং সেট করো। প্রথমবার হলে created=true (পয়েন্ট মেলে), আবার রেটিং
 * বদলালে stars আপডেট হয় কিন্তু created=false — কোনো অতিরিক্ত পয়েন্ট নয়।
 */
export async function setRating(
  memberId: number,
  targetType: 'road' | 'spot',
  targetId: string,
  stars: number
): Promise<{ created: boolean; average: number | null; count: number }> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data: existing } = await supa
        .from('ratings')
        .select('id')
        .eq('member_id', memberId)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .limit(1);
      if (existing && existing.length > 0) {
        await supa.from('ratings').update({ stars }).eq('id', existing[0].id);
        const agg = await ratingAggregate(targetType, targetId);
        return { created: false, ...agg };
      }
      const { error } = await supa
        .from('ratings')
        .insert({ member_id: memberId, target_type: targetType, target_id: targetId, stars });
      if (error && error.code !== '23505') {
        /* fall through to demo */
      } else {
        const agg = await ratingAggregate(targetType, targetId);
        return { created: error?.code === '23505' ? false : true, ...agg };
      }
    } catch {
      /* fall through to demo */
    }
  }
  const store = demoRatings();
  const mine = store.find(
    (r) => r.member_id === memberId && r.target_type === targetType && r.target_id === targetId
  );
  let created: boolean;
  if (mine) {
    mine.stars = stars;
    created = false;
  } else {
    store.push({
      id: Date.now() + Math.floor(Math.random() * 1000),
      member_id: memberId,
      target_type: targetType,
      target_id: targetId,
      stars,
      created_at: new Date().toISOString(),
    });
    created = true;
  }
  const agg = await ratingAggregate(targetType, targetId);
  return { created, ...agg };
}

/* ---------- leaderboard ---------- */

export interface LeaderRow {
  id: number;
  name: string;
  points: number;
  badges: string[];
}

export async function getLeaderboard(limit = 20): Promise<LeaderRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('members')
        .select('id,name,points,badges')
        .eq('show_on_leaderboard', true)
        .order('points', { ascending: false })
        .limit(limit);
      if (!error && data) {
        return (data as { id: number; name: string; points: number | null; badges: string[] | null }[]).map(
          (r) => ({ id: r.id, name: r.name, points: r.points ?? 0, badges: r.badges ?? [] })
        );
      }
    } catch {
      /* fall through to demo */
    }
  }
  ensureDemoSeed();
  return demoDb()
    .members.filter((m) => m.show_on_leaderboard !== false)
    .map((m) => ({ id: m.id, name: m.name, points: m.points ?? 0, badges: m.badges ?? [] }))
    .sort((a, b) => b.points - a.points)
    .slice(0, limit);
}

/** Demo/test helper: make sure the demo seed ran (idempotent). */
export function ensurePointsSeed(): void {
  ensureDemoSeed();
}
