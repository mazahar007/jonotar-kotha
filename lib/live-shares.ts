import { randomBytes } from 'crypto';
import { getSupabase } from './supabase';
import { createSosAlert } from './store';
import type {
  LiveBloodShare,
  LiveShareAdmin,
  LiveSharePublic,
  LiveSharePurpose,
} from './types';

/**
 * Phase 6 data layer: SOS live location shares.
 * Supabase first (service role); ANY failure (including schema-v6 not yet
 * run) falls back to an in-memory demo store — the same pattern as
 * lib/roads-store.ts / lib/members-store.ts, so the app never 500s.
 *
 * Privacy rules (brief): owner_token NEVER leaves this module's rows;
 * public payloads are built by sanitizePublic(); phone is included only
 * when the sharer set show_phone = true.
 */

export interface LiveShareRow {
  id: string;
  member_id: number | null;
  sharer_name: string;
  phone: string | null;
  show_phone: boolean;
  purpose: LiveSharePurpose;
  blood_group: string | null;
  note: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  updated_at: string;
  owner_token: string;
}

export const LIVE_SHARE_TTL_MS = 60 * 60 * 1000; // 1 hour

/* ---------- ids & tokens ---------- */

const ID_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // no look-alike chars

function newShareId(): string {
  const bytes = randomBytes(9);
  let out = '';
  for (let i = 0; i < 9; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

function newOwnerToken(): string {
  return randomBytes(16).toString('hex'); // 32 hex chars
}

/* ---------- demo store (globalThis, survives module reloads) ---------- */

const g = globalThis as unknown as { __jkLiveShares?: LiveShareRow[] };

function demoShares(): LiveShareRow[] {
  if (!g.__jkLiveShares) g.__jkLiveShares = [];
  return g.__jkLiveShares;
}

/* ---------- expiry / sanitizers ---------- */

export function isExpired(row: LiveShareRow, now: number = Date.now()): boolean {
  return new Date(row.expires_at).getTime() <= now;
}

/** A share is "live" only when it hasn't been stopped AND hasn't expired. */
export function effectiveActive(row: LiveShareRow, now: number = Date.now()): boolean {
  return row.is_active && !isExpired(row, now);
}

export function sanitizePublic(row: LiveShareRow): LiveSharePublic {
  const expired = isExpired(row);
  return {
    id: row.id,
    sharer_name: row.sharer_name,
    purpose: row.purpose,
    blood_group: row.blood_group,
    note: row.note,
    lat: row.lat,
    lng: row.lng,
    accuracy: row.accuracy,
    is_active: row.is_active && !expired,
    expired,
    expires_at: row.expires_at,
    updated_at: row.updated_at,
    ...(row.show_phone && row.phone ? { phone: row.phone } : {}),
  };
}

export function sanitizeAdmin(row: LiveShareRow): LiveShareAdmin {
  return {
    ...sanitizePublic(row),
    phone: row.phone,
    show_phone: row.show_phone,
    member_id: row.member_id,
    created_at: row.created_at,
  };
}

export function sanitizeBlood(row: LiveShareRow): LiveBloodShare {
  return {
    id: row.id,
    sharer_name: row.sharer_name,
    blood_group: row.blood_group,
    updated_at: row.updated_at,
  };
}

/* ---------- row lookup (tracks which store the row came from) ---------- */

type Found = { row: LiveShareRow; source: 'supa' | 'demo' } | null;

async function findRow(id: string): Promise<Found> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('live_shares').select('*').eq('id', id).single();
      if (!error && data) return { row: data as LiveShareRow, source: 'supa' };
      if (error && error.code !== 'PGRST116') {
        /* table missing etc. — fall through to demo */
      } else if (!error || error.code === 'PGRST116') {
        // Definitive "not there" from Supabase — still check demo in case a
        // create fell back while reads succeed (partial config edge).
        const demo = demoShares().find((s) => s.id === id);
        return demo ? { row: demo, source: 'demo' } : null;
      }
    } catch {
      /* fall through to demo */
    }
  }
  const demo = demoShares().find((s) => s.id === id);
  return demo ? { row: demo, source: 'demo' } : null;
}

export async function getLiveShareRow(id: string): Promise<LiveShareRow | null> {
  const found = await findRow(id);
  return found?.row ?? null;
}

/* ---------- create ---------- */

export interface CreateLiveShareInput {
  member_id: number | null;
  sharer_name: string;
  phone: string | null;
  show_phone: boolean;
  purpose: LiveSharePurpose;
  blood_group: string | null;
  note: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
}

export async function createLiveShare(
  input: CreateLiveShareInput
): Promise<{ id: string; owner_token: string; expires_at: string }> {
  const now = new Date();
  const row: LiveShareRow = {
    id: newShareId(),
    member_id: input.member_id,
    sharer_name: input.sharer_name,
    phone: input.phone,
    show_phone: input.show_phone,
    purpose: input.purpose,
    blood_group: input.purpose === 'blood' ? input.blood_group : null,
    note: input.note,
    lat: input.lat,
    lng: input.lng,
    accuracy: input.accuracy,
    is_active: true,
    expires_at: new Date(now.getTime() + LIVE_SHARE_TTL_MS).toISOString(),
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    owner_token: newOwnerToken(),
  };

  let saved = false;
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('live_shares').insert(row);
      if (!error) saved = true;
    } catch {
      /* fall through to demo */
    }
  }
  if (!saved) demoShares().push(row);

  // Danger shares also land in the admin SOS inbox (best-effort only).
  if (row.purpose === 'danger') {
    try {
      await createSosAlert({ alert_type: 'live_share', location: `/live/${row.id}` });
    } catch {
      /* never break share creation */
    }
  }

  return { id: row.id, owner_token: row.owner_token, expires_at: row.expires_at };
}

/* ---------- ping / stop ---------- */

export type OwnerOpResult = 'ok' | 'not_found' | 'forbidden' | 'inactive';

async function applyPatch(found: NonNullable<Found>, patch: Partial<LiveShareRow>): Promise<void> {
  if (found.source === 'supa') {
    const supa = getSupabase();
    if (supa) {
      try {
        const { error } = await supa.from('live_shares').update(patch).eq('id', found.row.id);
        if (!error) return;
      } catch {
        /* fall through */
      }
    }
  }
  Object.assign(found.row, patch);
}

export async function pingLiveShare(
  id: string,
  ownerToken: string,
  lat: number,
  lng: number,
  accuracy: number | null
): Promise<{ result: OwnerOpResult; updated_at?: string }> {
  const found = await findRow(id);
  if (!found) return { result: 'not_found' };
  if (found.row.owner_token !== ownerToken) return { result: 'forbidden' };
  if (!effectiveActive(found.row)) return { result: 'inactive' };
  const updated_at = new Date().toISOString();
  await applyPatch(found, { lat, lng, accuracy, updated_at });
  return { result: 'ok', updated_at };
}

export async function stopLiveShare(
  id: string,
  ownerToken: string | null,
  opts: { admin?: boolean } = {}
): Promise<OwnerOpResult> {
  const found = await findRow(id);
  if (!found) return 'not_found';
  if (!opts.admin && found.row.owner_token !== ownerToken) return 'forbidden';
  if (found.row.is_active) {
    await applyPatch(found, { is_active: false, updated_at: new Date().toISOString() });
  }
  return 'ok';
}

/* ---------- lists ---------- */

async function allRows(): Promise<LiveShareRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('live_shares')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (!error && data) return data as LiveShareRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return [...demoShares()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listAdminLiveShares(): Promise<LiveShareAdmin[]> {
  const rows = await allRows();
  return rows.map(sanitizeAdmin);
}

/** Active (not stopped, not expired) shares of one purpose — minimal payload. */
export async function listActiveShares(purpose: LiveSharePurpose): Promise<LiveShareRow[]> {
  const rows = await allRows();
  return rows.filter((r) => r.purpose === purpose && effectiveActive(r));
}
