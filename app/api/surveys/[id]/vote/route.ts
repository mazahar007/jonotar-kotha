import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSessionMemberRow } from '@/lib/member-session';
import {
  addResponseRow,
  getSurveyRow,
  locationNameMaps,
  memberInScope,
  rowToMember,
  surveyWithState,
} from '@/lib/members-store';

/** Cast a vote. Member session required; server verifies home-area scope + one vote only. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memberRow = await getSessionMemberRow();
  if (!memberRow) return err('ভোট দিতে নিবন্ধন / লগইন করুন', 401);
  const member = rowToMember(memberRow);

  const survey = await getSurveyRow(Number(id));
  if (!survey) return err('জরিপ পাওয়া যায়নি', 404);
  if (survey.status !== 'active') return err('এই জরিপটি বন্ধ হয়ে গেছে', 400);
  if (!memberInScope(member, survey)) return err('এই জরিপটি আপনার এলাকার জন্য নয়', 403);

  const body = await req.json().catch(() => ({}));
  const optionIndex = Number(body.option_index);
  if (Number.isNaN(optionIndex)) return err('একটি অপশন বেছে নিন');

  const result = await addResponseRow(survey, memberRow, optionIndex);
  if (!result.ok) {
    if (result.reason === 'already') return err('আপনি আগেই ভোট দিয়েছেন', 409);
    return err('সঠিক অপশন বেছে নিন');
  }
  const maps = await locationNameMaps();
  return ok(await surveyWithState(survey, member, maps), 201);
}
