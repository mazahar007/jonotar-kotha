import { NextRequest } from 'next/server';
import { err, ok, requireAdmin } from '@/lib/api';
import { getSessionMember } from '@/lib/member-session';
import {
  deleteSurveyRow,
  getSurveyRow,
  locationNameMaps,
  surveyWithState,
  updateSurveyRow,
} from '@/lib/members-store';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const survey = await getSurveyRow(Number(id));
  if (!survey) return err('জরিপ পাওয়া যায়নি', 404);
  const [admin, member, maps] = await Promise.all([requireAdmin(), getSessionMember(), locationNameMaps()]);
  return ok(await surveyWithState(survey, member, maps, { admin }));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body.question === 'string' && body.question.trim()) patch.question = body.question.trim();
  if (Array.isArray(body.options)) {
    const options = body.options.map((o: unknown) => String(o).trim()).filter(Boolean);
    if (options.length < 2 || options.length > 6) return err('অপশন ২–৬টি হতে হবে');
    patch.options = options;
  }
  if (body.status === 'active' || body.status === 'closed') patch.status = body.status;
  const row = await updateSurveyRow(Number(id), patch);
  if (!row) return err('জরিপ পাওয়া যায়নি', 404);
  const maps = await locationNameMaps();
  return ok(await surveyWithState(row, null, maps, { admin: true }));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { id } = await params;
  const done = await deleteSurveyRow(Number(id));
  if (!done) return err('জরিপ পাওয়া যায়নি', 404);
  return ok({ ok: true });
}
