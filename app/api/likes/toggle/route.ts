import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { award, toggleLike, touchActivity } from '@/lib/points';

function clean(v: unknown): string {
  return String(v ?? '').trim();
}

/**
 * POST /api/likes/toggle — like/unlike. Login required.
 * Like দেওয়ায় +১ পয়েন্ট (প্রতি সদস্য–টার্গেটে একবারই); unlike-এ পয়েন্ট
 * ফেরত যায় না। নিষ্ক্রিয়তা নিয়ম সবসময় প্রযোজ্য (touchActivity)।
 */
export async function POST(req: NextRequest) {
  const member = await getSessionMember();
  if (!member) return err('লাইক দিতে লগিন করুন', 401);
  const body = await req.json().catch(() => ({}));
  const targetType = clean(body.target_type);
  const targetId = clean(body.target_id);
  if (targetType !== 'report' && targetType !== 'comment') return err('ভুল টার্গেট');
  if (!targetId) return err('ভুল টার্গেট');

  const toggled = await toggleLike(member.id, targetType, targetId);
  let points: number | undefined;
  let newBadges: string[] = [];
  if (toggled.liked) {
    const res = await award(member.id, 'like', { refType: 'like', refId: `${targetType}:${targetId}` });
    points = res.points;
    newBadges = res.newBadges;
  } else {
    const touch = await touchActivity(member.id);
    points = touch.points;
  }
  return ok({ ...toggled, points, newBadges });
}
