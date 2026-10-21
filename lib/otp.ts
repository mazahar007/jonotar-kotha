import { createHash, randomInt } from 'crypto';
import { getSupabase } from './supabase';

/**
 * Phase 13 OTP engine.
 * - 6-digit code, 5-minute expiry, max 5 attempts, 60s resend cooldown.
 * - Codes are stored as SHA-256 hashes (never plain text).
 * - Supabase first; ANY failure (including schema-v13 not yet run) falls
 *   back to an in-memory demo store so the app never 500s — same pattern
 *   as lib/report-comments.ts.
 */

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export type OtpChannel = 'sms' | 'email';
export type OtpPurpose = 'register' | 'login' | 'verify_phone';

export interface OtpRow {
  id: number;
  channel: OtpChannel;
  destination: string;
  code_hash: string;
  purpose: OtpPurpose;
  expires_at: string;
  attempts: number;
  consumed: boolean;
  created_at: string;
}

export function channelFor(destination: string): OtpChannel {
  return destination.includes('@') ? 'email' : 'sms';
}

/** Bangladeshi mobile format (01XXXXXXXXX) or generic 10-14 digit. */
export function validPhone(p: string): boolean {
  return /^01\d{9}$|^\d{10,14}$/.test(p);
}

/** Lightweight email format check (not a full RFC validator). */
export function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function generateCode(): string {
  return String(randomInt(100000, 1000000));
}

export function hashCode(code: string): string {
  return createHash('sha256').update(`jk-otp:${code}`).digest('hex');
}

/* ---------- demo store (globalThis, survives module reloads) ---------- */

const g = globalThis as unknown as { __jkOtps?: OtpRow[]; __jkOtpSeq?: number };

function demoOtps(): OtpRow[] {
  if (!g.__jkOtps) {
    g.__jkOtps = [];
    g.__jkOtpSeq = 1;
  }
  return g.__jkOtps!;
}

/** Normalize a phone destination the same way the member login does. */
export function normalizeDestination(raw: string): string {
  const s = String(raw ?? '').trim();
  if (s.includes('@')) return s.toLowerCase();
  return s.replace(/[\s-]/g, '');
}

/* ---------- issue a code ---------- */

export type IssueOtpResult =
  | { ok: true; code: string; row: OtpRow }
  | { ok: false; error: string; retry_after_ms?: number };

export async function issueOtp(
  destination: string,
  purpose: OtpPurpose
): Promise<IssueOtpResult> {
  const dest = normalizeDestination(destination);
  if (!dest) return { ok: false, error: 'ঠিকানা দিন' };
  const channel = channelFor(dest);
  const code = generateCode();
  const now = new Date();
  const rowData = {
    channel,
    destination: dest,
    code_hash: hashCode(code),
    purpose,
    expires_at: new Date(now.getTime() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    consumed: false,
    created_at: now.toISOString(),
  };

  const supa = getSupabase();
  if (supa) {
    try {
      // Resend cooldown: no unconsumed code for same destination+purpose in the last 60s.
      const since = new Date(now.getTime() - OTP_RESEND_COOLDOWN_MS).toISOString();
      const { data: recent } = await supa
        .from('otp_codes')
        .select('id, created_at')
        .eq('destination', dest)
        .eq('purpose', purpose)
        .eq('consumed', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1);
      if (recent && recent.length > 0) {
        const wait = OTP_RESEND_COOLDOWN_MS - (now.getTime() - new Date(recent[0].created_at).getTime());
        return { ok: false, error: 'একটু অপেক্ষা করে আবার কোড পাঠান', retry_after_ms: Math.max(0, Math.ceil(wait / 1000) * 1000) };
      }
      // Opportunistic cleanup of expired rows (housekeeping).
      await supa.from('otp_codes').delete().lt('expires_at', new Date(now.getTime() - 60 * 60 * 1000).toISOString());
      const { data, error } = await supa.from('otp_codes').insert(rowData).select().single();
      if (!error && data) return { ok: true, code, row: data as OtpRow };
      /* fall through to demo on any error (e.g. schema-v13 not run) */
    } catch {
      /* fall through */
    }
  }

  // ---- demo store ----
  const store = demoOtps();
  const recent = store
    .filter((o) => o.destination === dest && o.purpose === purpose && !o.consumed)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (recent && now.getTime() - new Date(recent.created_at).getTime() < OTP_RESEND_COOLDOWN_MS) {
    const wait = OTP_RESEND_COOLDOWN_MS - (now.getTime() - new Date(recent.created_at).getTime());
    return { ok: false, error: 'একটু অপেক্ষা করে আবার কোড পাঠান', retry_after_ms: Math.max(0, Math.ceil(wait / 1000) * 1000) };
  }
  const row: OtpRow = { id: g.__jkOtpSeq!++, ...rowData };
  store.push(row);
  return { ok: true, code, row };
}

/* ---------- verify a code ---------- */

export type VerifyOtpResult =
  | { ok: true; row: OtpRow }
  | { ok: false; error: string; attempts_left?: number };

async function bumpAttemptsSupa(supa: NonNullable<ReturnType<typeof getSupabase>>, id: number, attempts: number) {
  await supa.from('otp_codes').update({ attempts }).eq('id', id);
}

export async function verifyOtp(
  destination: string,
  code: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResult> {
  const dest = normalizeDestination(destination);
  const guess = String(code ?? '').replace(/\D/g, '').slice(0, 6);
  if (!dest || guess.length !== 6) return { ok: false, error: 'সঠিক ৬ সংখ্যার কোড দিন' };

  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('otp_codes')
        .select('*')
        .eq('destination', dest)
        .eq('purpose', purpose)
        .eq('consumed', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        const row = data as OtpRow;
        if (new Date(row.expires_at).getTime() <= Date.now()) {
          return { ok: false, error: 'কোডের মেয়াদ শেষ হয়ে গেছে — আবার পাঠান' };
        }
        if (row.attempts >= OTP_MAX_ATTEMPTS) {
          return { ok: false, error: 'অনেকবার ভুল কোড দেওয়া হয়েছে — নতুন কোড পাঠান' };
        }
        if (row.code_hash !== hashCode(guess)) {
          const attempts = row.attempts + 1;
          await bumpAttemptsSupa(supa, row.id, attempts);
          const left = OTP_MAX_ATTEMPTS - attempts;
          return {
            ok: false,
            error: left > 0 ? `ভুল কোড (আরও ${left} বার চেষ্টা করতে পারবেন)` : 'ভুল কোড — আর চেষ্টা বাকি নেই, নতুন কোড পাঠান',
            attempts_left: Math.max(0, left),
          };
        }
        await supa.from('otp_codes').update({ consumed: true }).eq('id', row.id);
        return { ok: true, row };
      }
      // Table missing / no row — if it looks like a "no code" situation, fall
      // through to the demo store so dev smoke tests still work.
    } catch {
      /* fall through */
    }
  }

  // ---- demo store ----
  const store = demoOtps();
  const row = store
    .filter((o) => o.destination === dest && o.purpose === purpose && !o.consumed)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!row) return { ok: false, error: 'কোনো কোড পাঠানো হয়নি — আগে কোড পাঠান' };
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return { ok: false, error: 'কোডের মেয়াদ শেষ হয়ে গেছে — আবার পাঠান' };
  }
  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: 'অনেকবার ভুল কোড দেওয়া হয়েছে — নতুন কোড পাঠান' };
  }
  if (row.code_hash !== hashCode(guess)) {
    row.attempts += 1;
    const left = OTP_MAX_ATTEMPTS - row.attempts;
    return {
      ok: false,
      error: left > 0 ? `ভুল কোড (আরও ${left} বার চেষ্টা করতে পারবেন)` : 'ভুল কোড — আর চেষ্টা বাকি নেই, নতুন কোড পাঠান',
      attempts_left: Math.max(0, left),
    };
  }
  row.consumed = true;
  return { ok: true, row };
}

/* ---------- test/dev helpers ---------- */

export function expireLatestOtpForTest(destination: string, purpose: OtpPurpose): boolean {
  const dest = normalizeDestination(destination);
  const store = demoOtps();
  const row = store
    .filter((o) => o.destination === dest && o.purpose === purpose && !o.consumed)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!row) return false;
  row.expires_at = new Date(Date.now() - 1000).toISOString();
  return true;
}
