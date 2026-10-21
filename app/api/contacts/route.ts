import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMemberRow } from '@/lib/member-session';
import { addContact, listContacts, validBdPhone } from '@/lib/trusted-contacts';

/**
 * Phase 11 — a member's own trusted contacts.
 * Privacy: logged-out callers get 401; members can only ever see their own.
 */

/** GET /api/contacts → the session member's contacts (401 when logged out). */
export async function GET() {
  const member = await getSessionMemberRow();
  if (!member) return err('লগইন করা নেই', 401);
  return ok(await listContacts(member.id));
}

/** POST /api/contacts { name, phone } → add a contact to the session member. */
export async function POST(req: NextRequest) {
  const member = await getSessionMemberRow();
  if (!member) return err('লগইন করা নেই', 401);
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  if (!name) return err('নাম লিখুন', 400);
  if (!validBdPhone(phone)) return err('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)', 400);
  return ok(await addContact(member.id, { name, phone }), 201);
}
