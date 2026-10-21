import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getVerifyCount, hasVoted, toggleVerify } from '@/lib/report-comments';
import { VERIFY_BADGE_THRESHOLD } from '@/lib/types';

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
  const voterKey = cleanKey(body.voter_key);
  if (!voterKey) return err('ভোটার তথ্য আবশ্যক');
  const memberId = typeof body.member_id === 'number' ? body.member_id : null;
  const result = await toggleVerify(reportId, voterKey, memberId);
  if (!result) return err('রিপোর্ট পাওয়া যায়নি', 404);
  return ok({ ...result, verified: result.count >= VERIFY_BADGE_THRESHOLD });
}
