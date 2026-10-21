import { getSupabase } from './supabase';
import { getAllMemberRows } from './members-store';
import { createNotification } from './push';
import { getRoadRows, getRoadUpdateRows } from './roads-store';
import type { StatusRequest } from './types';

/**
 * Phase 18 — "🔔 বর্তমান অবস্থা জানতে চাই" (status requests).
 * Supabase first (service role); ANY failure falls back to the in-memory
 * demo store so the app never 500s. One ACTIVE request per (road, member);
 * a new update to the road resolves all pending requests and notifies
 * each requester. NO points are awarded for requesting (avoid gaming).
 */

export interface StatusRequestRow {
  id: number;
  road_id: number;
  requester_member_id: number;
  created_at: string;
  resolved_at: string | null;
}

interface StatusRequestDb {
  requests: StatusRequestRow[];
  nextId: number;
}

const g = globalThis as unknown as { __jkStatusReqDb?: StatusRequestDb };

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

// Demo: one pending request so the "already requested" state is visible.
function seedDb(): StatusRequestDb {
  return {
    requests: [
      {
        id: 1,
        road_id: 8, // জিলা স্কুল মোড়
        requester_member_id: 2, // মোঃ সাকিব হাসান
        created_at: ago(2 * 3_600_000),
        resolved_at: null,
      },
    ],
    nextId: 2,
  };
}

export function statusRequestDb(): StatusRequestDb {
  if (!g.__jkStatusReqDb) g.__jkStatusReqDb = seedDb();
  return g.__jkStatusReqDb;
}

function toRequest(r: StatusRequestRow): StatusRequest {
  return { ...r };
}

async function getRequestRows(roadId: number): Promise<StatusRequestRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('status_requests')
        .select('*')
        .eq('road_id', roadId)
        .order('created_at', { ascending: false });
      if (!error && data) return data as StatusRequestRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return statusRequestDb().requests.filter((r) => r.road_id === roadId);
}

/** { requested: current member has an ACTIVE request, pendingCount: total active }. */
export async function getRequestState(
  roadId: number,
  memberId: number | null
): Promise<{ requested: boolean; pendingCount: number }> {
  const rows = await getRequestRows(roadId);
  const active = rows.filter((r) => !r.resolved_at);
  return {
    requested: memberId != null && active.some((r) => r.requester_member_id === memberId),
    pendingCount: active.length,
  };
}

/**
 * Create a request. Returns { created } — false when the member already has
 * an active request for this road (idempotent; no duplicate notifications).
 */
export async function createStatusRequest(
  roadId: number,
  memberId: number
): Promise<{ created: boolean; pendingCount: number }> {
  const state = await getRequestState(roadId, memberId);
  if (state.requested) return { created: false, pendingCount: state.pendingCount };

  const row = {
    road_id: roadId,
    requester_member_id: memberId,
    created_at: new Date().toISOString(),
    resolved_at: null,
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('status_requests').insert(row);
      // Unique-violation (race) → treat as already-requested.
      if (error && /duplicate|unique/i.test(error.message)) {
        const s = await getRequestState(roadId, memberId);
        return { created: false, pendingCount: s.pendingCount };
      }
      if (!error) {
        const s = await getRequestState(roadId, memberId);
        return { created: true, pendingCount: s.pendingCount };
      }
    } catch {
      /* fall through to demo */
    }
  }
  const db = statusRequestDb();
  if (!db.requests.some((r) => r.road_id === roadId && r.requester_member_id === memberId && !r.resolved_at)) {
    db.requests.push({ id: db.nextId++, ...row });
  }
  const s = await getRequestState(roadId, memberId);
  return { created: true, pendingCount: s.pendingCount };
}

/**
 * Mark all pending requests for a road resolved. Returns the requester
 * member ids (for notifying them about the new update).
 */
export async function resolveStatusRequests(roadId: number): Promise<number[]> {
  const rows = await getRequestRows(roadId);
  const pending = rows.filter((r) => !r.resolved_at);
  if (pending.length === 0) return [];
  const now = new Date().toISOString();
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa
        .from('status_requests')
        .update({ resolved_at: now })
        .eq('road_id', roadId)
        .is('resolved_at', null);
      if (!error) return [...new Set(pending.map((r) => r.requester_member_id))];
    } catch {
      /* fall through to demo */
    }
  }
  const db = statusRequestDb();
  for (const r of db.requests) {
    if (r.road_id === roadId && !r.resolved_at) r.resolved_at = now;
  }
  return [...new Set(pending.map((r) => r.requester_member_id))];
}

/**
 * Recent contributors: distinct members who posted updates to this road in
 * the last 7 days (max 20), excluding `excludeMemberId`. Resolves via
 * update.member_id first, then falls back to matching reporter_name
 * against member names (legacy rows).
 */
export async function getRecentContributors(
  roadId: number,
  excludeMemberId: number | null = null
): Promise<number[]> {
  const cutoff = Date.now() - 7 * 24 * 3_600_000;
  const updates = (await getRoadUpdateRows(roadId)).filter(
    (u) => new Date(u.created_at).getTime() >= cutoff
  );
  const ids = new Set<number>();
  for (const u of updates) {
    if (u.member_id != null) ids.add(u.member_id);
  }
  // Legacy fallback: match reporter_name to a member name.
  if (updates.some((u) => u.member_id == null && u.reporter_name)) {
    try {
      const members = await getAllMemberRows();
      const byName = new Map(members.map((m) => [m.name.trim(), m.id]));
      for (const u of updates) {
        if (u.member_id == null && u.reporter_name) {
          const id = byName.get(u.reporter_name.trim());
          if (id != null) ids.add(id);
        }
      }
    } catch {
      /* names unavailable — skip */
    }
  }
  if (excludeMemberId != null) ids.delete(excludeMemberId);
  return [...ids].slice(0, 20);
}

/** Road name for notification text (falls back to a generic label). */
export async function roadName(roadId: number): Promise<string> {
  try {
    const rows = await getRoadRows();
    return rows.find((r) => r.id === roadId)?.name ?? 'জায়গাটি';
  } catch {
    return 'জায়গাটি';
  }
}

/**
 * Notify recent contributors that someone asked for the current status.
 * One targeted in-app notification per contributor (member_id set).
 */
export async function notifyContributorsOfRequest(
  roadId: number,
  requesterMemberId: number
): Promise<number> {
  const name = await roadName(roadId);
  const contributors = await getRecentContributors(roadId, requesterMemberId);
  for (const memberId of contributors) {
    await createNotification({
      member_id: memberId,
      title: `📍 ${name}-এর বর্তমান অবস্থা জানতে চাওয়া হয়েছে`,
      body: 'কেউ এই জায়গার লেটেস্ট অবস্থা জানতে চেয়েছে — নতুন কিছু জানলে আপডেট দিন।',
      url: `/roads/${roadId}`,
      kind: 'status_request',
    });
  }
  return contributors.length;
}

/**
 * Resolve pending requests after a new update and notify each requester
 * that fresh info arrived. Called from every road-update write path.
 */
export async function resolveAndNotifyRequesters(
  roadId: number,
  statusLabels: string
): Promise<number> {
  const requesters = await resolveStatusRequests(roadId);
  if (requesters.length === 0) return 0;
  const name = await roadName(roadId);
  for (const memberId of requesters) {
    await createNotification({
      member_id: memberId,
      title: `📍 ${name}-এ নতুন আপডেট এসেছে`,
      body: statusLabels ? `বর্তমান অবস্থা: ${statusLabels}` : 'আপনার অনুরোধের জায়গায় নতুন তথ্য পোস্ট হয়েছে।',
      url: `/roads/${roadId}`,
      kind: 'status_update',
    });
  }
  return requesters.length;
}
