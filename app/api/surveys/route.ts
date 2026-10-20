import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import {
  createSurveyRow,
  getSurveyRows,
  locationNameMaps,
  surveyWithState,
} from '@/lib/members-store';
import type { SurveyTargetLevel } from '@/lib/types';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  const includeAll = admin && req.nextUrl.searchParams.get('all') === '1';
  const [rows, member, maps] = await Promise.all([
    getSurveyRows(!includeAll),
    getSessionMember(),
    locationNameMaps(),
  ]);
  const out = [];
  for (const s of rows) out.push(await surveyWithState(s, member, maps, { admin }));
  return ok(out);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const body = await req.json().catch(() => ({}));
  const question = String(body.question || '').trim();
  const options = Array.isArray(body.options)
    ? body.options.map((o: unknown) => String(o).trim()).filter(Boolean)
    : [];
  if (!question) return err('জরিপের প্রশ্ন লিখুন');
  if (options.length < 2 || options.length > 6) return err('অপশন ২–৬টি হতে হবে');
  const levels: SurveyTargetLevel[] = ['all', 'division', 'district', 'upazila', 'thana', 'union'];
  const target_level = levels.includes(body.target_level) ? (body.target_level as SurveyTargetLevel) : 'all';
  const target_id =
    target_level === 'all' ? null : body.target_id != null && !Number.isNaN(Number(body.target_id)) ? Number(body.target_id) : null;
  if (target_level !== 'all' && target_id == null) return err('জরিপের এলাকা বেছে নিন');
  const row = await createSurveyRow({ question, options, target_level, target_id });
  const maps = await locationNameMaps();
  return ok(await surveyWithState(row, null, maps, { admin: true }), 201);
}
