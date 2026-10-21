import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getVerifyCount, hasVoted, toggleVerify } from '@/lib/report-comments';
import { VERIFY_BADGE_THRESHOLD } from '@/lib/types';
import { getSessionMember } from '@/lib/member-session';
import { award, touchActivity } from '@/lib/points';

function cleanKey(v: unknown): string | null {
  const k = String(v ?? '').trim();
  return k && k.length <= 64 ? k : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reportId = Number((await params).id);
  if (!Number.isFinite(reportId)) return err('ভুল রিপোর্ট');
  const voterKey = cleanKey(req.nextUrl.searchParams.get('voter_key'));
  const count = await getVerifyCount(reportId);
  return ok({
    count,
    verified: count >= VERIFY_BADGE_THRESHOLD,
    voted: voterKey ? await hasVoted(reportId, voterKey) : false,
  });
}

/** Toggle semantics: first POST votes, second POST removes the vote. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reportId = Number((await params).id);
  if (!Number.isFinite(reportId)) return err('ভুল রিপোর্ট');
  const body = await req.json().catch(() => ({}));
  // Phase 15: সদস্য-পরিচয় সেশন থেকে — লগ-ইন থাকলে voter_key সদস্য-ভিত্তিক
  // (m:<id>), না থাকলে আগের মতো বেনামী কী। পয়েন্ট কেবল সদস্যের।
  const member = await getSessionMember();
  const voterKey = member ? `m:${member.id}` : cleanKey(body.voter_key);
  if (!voterKey) return err('ভোটার তথ্য আবশ্যক');
  const memberId = member ? member.id : typeof body.member_id === 'number' ? body.member_id : null;
  const result = await toggleVerify(reportId, voterKey, memberId);
  if (!result) return err('রিপোর্ট পাওয়া যায়নি', 404);
  // Phase 15: ভোট দিলে +১ (একই রিপোর্টে দ্বিতীয়বার নয় — লেজার-চেক);
  // ভোট তুলে নিলে শুধু নিষ্ক্রিয়তা নিয়ম।
  let points: number | undefined;
  let newBadges: string[] = [];
  if (member) {
    if (result.voted) {
      const res = await award(member.id, 'verify', { refType: 'verify', refId: `report:${reportId}` });
      points = res.points;
      newBadges = res.newBadges;
    } else {
      points = (await touchActivity(member.id)).points;
    }
  }
  return ok({ ...result, verified: result.count >= VERIFY_BADGE_THRESHOLD, points, newBadges });
}
