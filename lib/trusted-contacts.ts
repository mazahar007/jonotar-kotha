import { getSupabase } from './supabase';

/**
 * Phase 11 data layer: trusted contacts (আমার পরিচিতজন) for SOS alerts.
 * Supabase first (service role); ANY failure (including schema-v11 not yet
 * run) falls back to the in-memory demo store so the app never 500s.
 *
 * Privacy: every function takes an explicit memberId. Callers MUST resolve
 * it from the member phone session — contacts are never listed for anyone
 * else. The routes return 401 when no member session is present.
 */

export interface TrustedContactRow {
  id: number;
  member_id: number;
  name: string;
  phone: string;
  created_at: string;
}

/** BD mobile: 01XXXXXXXXX (11 digits). */
export function validBdPhone(phone: string): boolean {
  return /^01\d{9}$/.test(phone.trim());
}

/** 01711000001 → 8801711000001 for wa.me deep links. */
export function toWaNumber(phone: string): string {
  const p = phone.trim();
  return p.startsWith('880') ? p : `880${p.slice(1)}`;
}

/* ---------- demo fallback (survives module reloads via globalThis) ---------- */

/**
 * Seed contacts for the demo member (seed member id 1, মোঃ আরিফুল ইসলাম,
 * 01711000001). The first contact is ALSO a registered member (seed member 2,
 * মোঃ সাকিব হাসান 01711000002) so the "contact is a member → in-app alert"
 * path exercises; the second is a non-member.
 */
const seedContacts: TrustedContactRow[] = [
  { id: 1, member_id: 1, name: 'মোঃ সাকিব হাসান', phone: '01711000002', created_at: '2026-10-21T00:00:00.000Z' },
  { id: 2, member_id: 1, name: 'মোঃ কবির হোসেন', phone: '01712345678', created_at: '2026-10-21T00:00:00.000Z' },
];

interface ContactsDemoDb {
  contacts: TrustedContactRow[];
  nextId: number;
}

const g = globalThis as unknown as { __jkContactsDb?: ContactsDemoDb };

export function contactsDemoDb(): ContactsDemoDb {
  if (!g.__jkContactsDb) {
    const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    g.__jkContactsDb = {
      contacts: clone(seedContacts),
      nextId: seedContacts.length + 1,
    };
  }
  return g.__jkContactsDb;
}

/* ---------- data access ---------- */

export async function listContacts(memberId: number): Promise<TrustedContactRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('trusted_contacts')
        .select('*')
        .eq('member_id', memberId)
        .order('created_at', { ascending: true });
      if (!error && data) return data as TrustedContactRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return contactsDemoDb()
    .contacts.filter((c) => c.member_id === memberId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function addContact(
  memberId: number,
  input: { name: string; phone: string }
): Promise<TrustedContactRow> {
  const row = {
    member_id: memberId,
    name: input.name.trim().slice(0, 60),
    phone: input.phone.trim(),
    created_at: new Date().toISOString(),
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa.from('trusted_contacts').insert(row).select().single();
      if (!error && data) return data as TrustedContactRow;
    } catch {
      /* fall through to demo */
    }
  }
  const db = contactsDemoDb();
  const demoRow: TrustedContactRow = { id: db.nextId++, ...row };
  db.contacts.push(demoRow);
  return demoRow;
}

export async function deleteContact(memberId: number, id: number): Promise<boolean> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('trusted_contacts')
        .delete()
        .eq('id', id)
        .eq('member_id', memberId)
        .select('id');
      if (!error) return (data?.length ?? 0) > 0;
    } catch {
      /* fall through to demo */
    }
  }
  const db = contactsDemoDb();
  const before = db.contacts.length;
  db.contacts = db.contacts.filter((c) => !(c.id === id && c.member_id === memberId));
  return db.contacts.length < before;
}

/** Admin read: every contact with its owner's name (never public). */
export async function listAllContacts(): Promise<
  (TrustedContactRow & { owner_name: string | null })[]
> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('trusted_contacts')
        .select('*, members!inner(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      if (!error && data) {
        return (data as (TrustedContactRow & { members: { name: string } })[]).map((r) => ({
          id: r.id,
          member_id: r.member_id,
          name: r.name,
          phone: r.phone,
          created_at: r.created_at,
          owner_name: r.members?.name ?? null,
        }));
      }
    } catch {
      /* fall through to demo */
    }
  }
  // Demo fallback: owner names from the demo member store.
  const { demoDb } = await import('./members-fallback');
  const members = demoDb().members;
  return contactsDemoDb().contacts.map((c) => ({
    ...c,
    owner_name: members.find((m) => m.id === c.member_id)?.name ?? null,
  }));
}
