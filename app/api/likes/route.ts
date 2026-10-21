import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import { getLikeState } from '@/lib/points';

/** GET /api/likes?target_type=report&target_id=1 — like state (liked needs a session). */
export async function GET(req: NextRequest) {
  const targetType = String(req.nextUrl.searchParams.get('target_type') ?? '').trim();
  const targetId = String(req.nextUrl.searchParams.get('target_id') ?? '').trim();
  if (targetType !== 'report' && targetType !== 'comment') return err('ভুল টার্গেট');
  if (!targetId) return err('ভুল টার্গেট');
  const member = await getSessionMember();
  return ok(await getLikeState(member?.id ?? null, targetType, targetId));
}
