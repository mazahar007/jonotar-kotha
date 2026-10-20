import { NextRequest } from 'next/server';
import { err, needSupa, ok, requireAdmin } from '@/lib/api';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { supa, res } = needSupa();
  if (!supa) return res;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  delete body.id;
  const { data, error } = await supa.from('volunteers').update(body).eq('id', id).select().single();
  if (error) return err('আপডেট করা যায়নি');
  return ok(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const { supa, res } = needSupa();
  if (!supa) return res;
  const { id } = await params;
  const { error } = await supa.from('volunteers').delete().eq('id', id);
  if (error) return err('মোছা যায়নি');
  return ok({ ok: true });
}
