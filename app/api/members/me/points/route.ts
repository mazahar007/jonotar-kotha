import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { getLedger } from '@/lib/points';

/**
 * GET /api/members/me/points?filter=earn|spend — নিজের পয়েন্ট লেজার।
 * filter=earn → শুধু ➕ অর্জিত পয়েন্ট; filter=spend → শুধু ➖ কাটা পয়েন্ট।
 * (প্রোফাইলে দুটি আলাদা তালিকার জন্য।)
 */
export async function GET(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('লগিন করা নেই', 401);
  const filter = req.nextUrl.searchParams.get('filter');
  const ledger = await getLedger(
    member.id,
    filter === 'earn' ? 'earn' : filter === 'spend' ? 'spend' : undefined
  );
  return ok({
    points: member.points,
    badges: member.badges,
    ledger,
  });
}
