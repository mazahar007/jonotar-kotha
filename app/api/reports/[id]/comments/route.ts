import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { createComment, listComments } from '@/lib/report-comments';
import { getSessionMember } from '@/lib/member-session';
import { award } from '@/lib/points';

function reportIdFrom(params: { id: string }): number {
  return Number(params.id);
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reportId = reportIdFrom(await params);
  if (!Number.isFinite(reportId)) return err('ভুল রিপোর্ট');
  return ok(await listComments(reportId));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reportId = reportIdFrom(await params);
  if (!Number.isFinite(reportId)) return err('ভুল রিপোর্ট');
  const body = await req.json().catch(() => ({}));
  const rawKey = String(body.voter_key || '').trim();
  if (!rawKey || rawKey.length > 64) return err('ভোটার তথ্য আবশ্যক');
  // Phase 15: সদস্য-পরিচয় সেশন থেকে (ক্লায়েন্টের member_id বিশ্বাস করা হয় না)।
  const member = await getSessionMember();
  const result = await createComment({
    report_id: reportId,
    member_id: member ? member.id : typeof body.member_id === 'number' ? body.member_id : null,
    display_name: String(body.display_name || member?.name || ''),
    body: String(body.body || ''),
    voter_key: rawKey.slice(0, 64),
  });
  if (!result.ok) return err(result.error);
  // Phase 15: লগ-ইন করা সদস্যের মন্তব্যে +১ পয়েন্ট।
  const bonus = member
    ? await award(member.id, 'comment', { refType: 'comment', refId: `comment:${result.comment.id}` })
    : { newBadges: [] as string[] };
  return ok({ ...result.comment, newBadges: bonus.newBadges }, 201);
}
