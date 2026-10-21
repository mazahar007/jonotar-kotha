import { getSupabase } from './supabase';
import { mockReports } from './mock';
import type { ReportComment, ReportVerification } from './types';

/**
 * Phase 7 data layer: report comments + verify votes.
 * Supabase first; ANY failure (including schema-v7 not yet run) falls back
 * to in-memory demo stores seeded with sample data — the same pattern as
 * lib/live-shares.ts, so the app never 500s.
 */

export interface CommentRow {
  id: number;
  report_id: number;
  member_id: number | null;
  display_name: string;
  body: string;
  created_at: string;
}

export interface VerificationRow {
  id: number;
  report_id: number;
  member_id: number | null;
  voter_key: string;
  created_at: string;
}

export const COMMENT_MAX_LEN = 500;
export const COMMENT_MIN_INTERVAL_MS = 30 * 1000; // anti-spam: 30s per voter_key

/* ---------- demo stores (globalThis, survive module reloads) ---------- */

const g = globalThis as unknown as {
  __jkComments?: CommentRow[];
  __jkVerifications?: VerificationRow[];
  __jkCommentSeq?: number;
  __jkVerifySeq?: number;
};

function seedDemo(): void {
  if (g.__jkComments && g.__jkVerifications) return;
  const now = Date.now();
  const iso = (minsAgo: number) => new Date(now - minsAgo * 60 * 1000).toISOString();
  g.__jkComments = [
    { id: 1, report_id: 1, member_id: 1, display_name: 'রহিম উদ্দিন', body: 'গতকাল আমিও দেখেছি, সত্যিই ভয়ংকর পরিস্থিতি। প্রশাসনের দ্রুত ব্যবস্থা নেওয়া উচিত।', created_at: iso(300) },
    { id: 2, report_id: 1, member_id: null, display_name: 'একজন পথচারী', body: 'সন্ধ্যা ৭টার পর একা চলাচল করা কঠিন হয়ে গেছে।', created_at: iso(180) },
    { id: 3, report_id: 1, member_id: 2, display_name: 'নাসরিন আক্তার', body: 'পুলিশ টহল বাড়ালে সমস্যা কমবে বলে মনে হয়।', created_at: iso(60) },
    { id: 4, report_id: 3, member_id: null, display_name: 'রিকশাচালক কামাল', body: 'এই গর্তে গত সপ্তাহে একটা অটো উল্টে গিয়েছিল, সাবধানে চলুন।', created_at: iso(240) },
    { id: 5, report_id: 3, member_id: 3, display_name: 'শফিকুল ইসলাম', body: 'মেরামতের জন্য পৌরসভায় আবেদন করেছি, সবাই সমর্থন দিন।', created_at: iso(90) },
  ];
  g.__jkVerifications = [
    { id: 1, report_id: 1, member_id: 1, voter_key: 'm:1', created_at: iso(320) },
    { id: 2, report_id: 1, member_id: 2, voter_key: 'm:2', created_at: iso(200) },
    { id: 3, report_id: 1, member_id: null, voter_key: 'anon:seed-1', created_at: iso(150) },
    { id: 4, report_id: 1, member_id: 3, voter_key: 'm:3', created_at: iso(40) },
    { id: 5, report_id: 3, member_id: 1, voter_key: 'm:1', created_at: iso(250) },
    { id: 6, report_id: 3, member_id: null, voter_key: 'anon:seed-2', created_at: iso(100) },
    { id: 7, report_id: 2, member_id: 2, voter_key: 'm:2', created_at: iso(120) },
  ];
  g.__jkCommentSeq = 6;
  g.__jkVerifySeq = 8;
}

function demoComments(): CommentRow[] {
  seedDemo();
  return g.__jkComments!;
}

function demoVerifications(): VerificationRow[] {
  seedDemo();
  return g.__jkVerifications!;
}

/* ---------- report lookup (for report_id sanity) ---------- */

async function reportExists(reportId: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('reports').select('id').eq('id', reportId).single();
      if (!error && data) return true;
      if (error && error.code !== 'PGRST116') {
        /* table missing etc. — fall through to mock */
      } else {
        return false;
      }
    } catch {
      /* fall through to mock */
    }
  }
  return mockReports.some((r) => r.id === reportId);
}

/* ---------- comments ---------- */

async function listCommentRows(reportId: number): Promise<CommentRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('report_comments')
        .select('*')
        .eq('report_id', reportId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!error && data) return data as CommentRow[];
      /* any error (table missing etc.) → demo */
    } catch {
      /* fall through */
    }
  }
  return demoComments()
    .filter((c) => c.report_id === reportId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export function listComments(reportId: number): Promise<CommentRow[]> {
  return listCommentRows(reportId);
}

export interface CreateCommentInput {
  report_id: number;
  member_id: number | null;
  display_name: string;
  body: string;
  voter_key: string;
}

export type CreateCommentResult =
  | { ok: true; comment: CommentRow }
  | { ok: false; error: string };

export async function createComment(input: CreateCommentInput): Promise<CreateCommentResult> {
  const body = input.body.trim().slice(0, COMMENT_MAX_LEN);
  if (body.length < 1) return { ok: false, error: 'মন্তব্য লিখুন' };
  if (!(await reportExists(input.report_id))) return { ok: false, error: 'রিপোর্ট পাওয়া যায়নি' };

  const name = input.display_name.trim().slice(0, 60) || 'বেনামী';

  const supa = getSupabase();
  if (supa) {
    try {
      // Lightweight anti-spam: same voter_key must wait 30s between comments.
      const since = new Date(Date.now() - COMMENT_MIN_INTERVAL_MS).toISOString();
      const { data: recent } = await supa
        .from('report_comments')
        .select('id')
        .eq('report_id', input.report_id)
        .eq('voter_key', input.voter_key)
        .gte('created_at', since)
        .limit(1);
      if (recent && recent.length > 0) return { ok: false, error: 'একটু অপেক্ষা করে আবার মন্তব্য করুন' };
      const { data, error } = await supa
        .from('report_comments')
        .insert({
          report_id: input.report_id,
          member_id: input.member_id,
          display_name: name,
          body,
          voter_key: input.voter_key,
        })
        .select()
        .single();
      if (!error && data) return { ok: true, comment: data as CommentRow };
      /* fall through to demo on any error */
    } catch {
      /* fall through */
    }
  }

  const store = demoComments();
  const last = store
    .filter((c) => c.report_id === input.report_id && c.display_name === name)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (last && Date.now() - new Date(last.created_at).getTime() < COMMENT_MIN_INTERVAL_MS) {
    return { ok: false, error: 'একটু অপেক্ষা করে আবার মন্তব্য করুন' };
  }
  const comment: CommentRow = {
    id: g.__jkCommentSeq!++,
    report_id: input.report_id,
    member_id: input.member_id,
    display_name: name,
    body,
    created_at: new Date().toISOString(),
  };
  store.push(comment);
  return { ok: true, comment };
}

/* ---------- verify votes ---------- */

async function listVerificationRows(reportId: number): Promise<VerificationRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('report_verifications')
        .select('*')
        .eq('report_id', reportId);
      if (!error && data) return data as VerificationRow[];
    } catch {
      /* fall through */
    }
  }
  return demoVerifications().filter((v) => v.report_id === reportId);
}

export async function getVerifyCount(reportId: number): Promise<number> {
  const rows = await listVerificationRows(reportId);
  return rows.length;
}

export async function hasVoted(reportId: number, voterKey: string): Promise<boolean> {
  const rows = await listVerificationRows(reportId);
  return rows.some((v) => v.voter_key === voterKey);
}

export interface ToggleVerifyResult {
  voted: boolean;
  count: number;
}

export async function toggleVerify(
  reportId: number,
  voterKey: string,
  memberId: number | null
): Promise<ToggleVerifyResult | null> {
  if (!(await reportExists(reportId))) return null;
  const supa = getSupabase();
  if (supa) {
    try {
      const { data: existing } = await supa
        .from('report_verifications')
        .select('id')
        .eq('report_id', reportId)
        .eq('voter_key', voterKey)
        .limit(1);
      if (existing && existing.length > 0) {
        await supa.from('report_verifications').delete().eq('id', existing[0].id);
      } else {
        const { error } = await supa
          .from('report_verifications')
          .insert({ report_id: reportId, member_id: memberId, voter_key: voterKey });
        if (error && error.code !== '23505') {
          /* fall through to demo on unexpected errors */
        } else if (error && error.code === '23505') {
          /* raced into a duplicate — treat as already voted, un-vote below */
          const { data: dup } = await supa
            .from('report_verifications')
            .select('id')
            .eq('report_id', reportId)
            .eq('voter_key', voterKey)
            .limit(1);
          if (dup && dup.length > 0) {
            await supa.from('report_verifications').delete().eq('id', dup[0].id);
          }
        }
      }
      const { count } = await supa
        .from('report_verifications')
        .select('id', { count: 'exact', head: true })
        .eq('report_id', reportId);
      const votedNow = await hasVoted(reportId, voterKey);
      return { voted: votedNow, count: count ?? 0 };
    } catch {
      /* fall through to demo */
    }
  }
  const store = demoVerifications();
  const idx = store.findIndex((v) => v.report_id === reportId && v.voter_key === voterKey);
  let voted: boolean;
  if (idx >= 0) {
    store.splice(idx, 1);
    voted = false;
  } else {
    store.push({
      id: g.__jkVerifySeq!++,
      report_id: reportId,
      member_id: memberId,
      voter_key: voterKey,
      created_at: new Date().toISOString(),
    });
    voted = true;
  }
  return { voted, count: store.filter((v) => v.report_id === reportId).length };
}

/** Counts for many reports at once (report cards). */
export async function getReportStats(
  reportIds: number[]
): Promise<Record<number, { verify_count: number; comment_count: number }>> {
  const out: Record<number, { verify_count: number; comment_count: number }> = {};
  const supa = getSupabase();
  if (supa) {
    try {
      const [vc, cc] = await Promise.all([
        supa.from('report_verifications').select('report_id').in('report_id', reportIds),
        supa.from('report_comments').select('report_id').in('report_id', reportIds),
      ]);
      if (!vc.error && vc.data && !cc.error && cc.data) {
        for (const id of reportIds) out[id] = { verify_count: 0, comment_count: 0 };
        for (const r of vc.data as { report_id: number }[]) out[r.report_id].verify_count++;
        for (const r of cc.data as { report_id: number }[]) out[r.report_id].comment_count++;
        return out;
      }
    } catch {
      /* fall through */
    }
  }
  for (const id of reportIds) {
    out[id] = {
      verify_count: demoVerifications().filter((v) => v.report_id === id).length,
      comment_count: demoComments().filter((c) => c.report_id === id).length,
    };
  }
  return out;
}

/* ---------- admin ---------- */

export interface AdminComment {
  id: number;
  report_id: number;
  report_title: string;
  member_id: number | null;
  display_name: string;
  body: string;
  created_at: string;
}

async function reportTitleMap(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('reports').select('id,title').in('id', ids);
      if (!error && data) {
        for (const r of data as { id: number; title: string }[]) map.set(r.id, r.title);
        return map;
      }
    } catch {
      /* fall through */
    }
  }
  for (const r of mockReports) map.set(r.id, r.title);
  return map;
}

export async function listAdminComments(limit = 100): Promise<AdminComment[]> {
  const supa = getSupabase();
  let rows: CommentRow[];
  if (supa) {
    try {
      const { data, error } = await supa
        .from('report_comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) rows = data as CommentRow[];
      else rows = [...demoComments()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
    } catch {
      rows = [...demoComments()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
    }
  } else {
    rows = [...demoComments()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  }
  const titles = await reportTitleMap([...new Set(rows.map((r) => r.report_id))]);
  return rows.map((r) => ({
    id: r.id,
    report_id: r.report_id,
    report_title: titles.get(r.report_id) ?? `#${r.report_id}`,
    member_id: r.member_id,
    display_name: r.display_name,
    body: r.body,
    created_at: r.created_at,
  }));
}

export async function deleteComment(id: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('report_comments').delete().eq('id', id);
      if (!error) return true;
    } catch {
      /* fall through */
    }
  }
  const store = demoComments();
  const idx = store.findIndex((c) => c.id === id);
  if (idx >= 0) {
    store.splice(idx, 1);
    return true;
  }
  return false;
}
