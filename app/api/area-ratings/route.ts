import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { voteAreaRating } from '@/lib/store';
import { getAreaRatings } from '@/lib/store';

export async function GET() {
  return ok(await getAreaRatings());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return err('id আবশ্যক');
  await voteAreaRating(id);
  return ok({ ok: true });
}

