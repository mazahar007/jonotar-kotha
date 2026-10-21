import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { award, getRatingState, setRating, touchActivity } from '@/lib/points';

/** GET /api/ratings?target_type=road&target_id=1 — my stars + aggregate. */
export async function GET(req: NextRequest) {
  const targetType = String(req.nextUrl.searchParams.get('target_type') ?? '').trim();
  const targetId = String(req.nextUrl.searchParams.get('target_id') ?? '').trim();
  if (targetType !== 'road' && targetType !== 'spot') return err('ভুল টার্গেট');
  if (!targetId) return err('ভুল টার্গেট');
  const member = await getSessionMember();
  return ok(await getRatingState(member?.id ?? null, targetType, targetId));
}

/**
 * POST /api/ratings — star rating (1–5) on a road/spot. Login required.
 * প্রথম রেটিংয়ে +১ পয়েন্ট; আবার রেটিং বদলালে stars আপডেট হয় কিন্তু
 * কোনো অতিরিক্ত পয়েন্ট নয়। নিষ্ক্রিয়তা নিয়ম সবসময় প্রযোজ্য।
 */
export async function POST(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('রেটিং দিতে লগিন করুন', 401);
  const body = await req.json().catch(() => ({}));
  const targetType = String(body.target_type ?? '').trim();
  const targetId = String(body.target_id ?? '').trim();
  const stars = Number(body.stars);
  if (targetType !== 'road' && targetType !== 'spot') return err('ভুল টার্গেট');
  if (!targetId) return err('ভুল টার্গেট');
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return err('১–৫ স্টার দিন');

  const rated = await setRating(member.id, targetType, targetId, stars);
  let points: number | undefined;
  let newBadges: string[] = [];
  if (rated.created) {
    const res = await award(member.id, 'rating', {
      refType: 'rating',
      refId: `${targetType}:${targetId}`,
    });
    points = res.points;
    newBadges = res.newBadges;
  } else {
    const touch = await touchActivity(member.id);
    points = touch.points;
  }
  return ok({ ...rated, points, newBadges });
}
