import { err, ok } from '@/lib/api';
import { getSessionMemberRow } from '@/lib/member-session';
import { deleteContact } from '@/lib/trusted-contacts';

/**
 * Phase 11 — delete one of the session member's own contacts.
 * DELETE /api/contacts/<id> — 401 when logged out, 404 when the id is not
 * one of this member's contacts.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const member = await getSessionMemberRow();
  if (!member) return err('লগইন করা নেই', 401);
  const { id } = await params;
  const cid = Number(id);
  if (!Number.isInteger(cid) || cid <= 0) return err('সঠিক কনট্যাক্ট নয়', 400);
  const removed = await deleteContact(member.id, cid);
  if (!removed) return err('কনট্যাক্ট পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
