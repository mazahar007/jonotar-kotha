import { NextRequest } from 'next/server';
import { needSupa, requireAdmin, err, ok } from '@/lib/api';
import { getBloodDonors } from '@/lib/store';

export async function GET() {
  return ok(await getBloodDonors());
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { supa, res } = needSupa();
  if (!supa) return res;
  const body = await req.json().catch(() => ({}));
  const { data, error } = await supa.from('blood_donors').insert(body).select().single();
  if (error) return err('সংরক্ষণ করা যায়নি');
  return ok(data, 201);
}

