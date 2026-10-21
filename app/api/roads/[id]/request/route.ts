import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import {
  createStatusRequest,
  getRequestState,
  notifyContributorsOfRequest,
} from '@/lib/status-requests';

/**
 * Phase 18 — "🔔 বর্তমান অবস্থা জানতে চাই".
 *
 * GET  /api/roads/[id]/request → { requested, pendingCount }
 *      (member optional; `requested` is per-member)
 * POST /api/roads/[id]/request → login required. Creates the request
 *      (idempotent — one active request per member per road) and notifies
 *      recent contributors via the in-app center. NO points for requesting.
 */

async function roadIdOf(params: Promise<{ id: string }>): Promise<number | null> {
  const { id } = await params;
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roadId = await roadIdOf(params);
  if (roadId == null) return err('সঠিক আইডি দিন');
  const member = await getSessionMember().catch(() => null);
  const state = await getRequestState(roadId, member?.id ?? null);
  return ok(state);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roadId = await roadIdOf(params);
  if (roadId == null) return err('সঠিক আইডি দিন');
  const member = await getSessionMember();
  if (!member) return err('অনুরোধ করতে লগিন করুন', 401);

  const { created, pendingCount } = await createStatusRequest(roadId, member.id);
  let notified = 0;
  if (created) {
    notified = await notifyContributorsOfRequest(roadId, member.id);
  }
  return ok({ requested: true, created, pendingCount, notified }, created ? 201 : 200);
}
