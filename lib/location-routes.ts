import { NextRequest } from 'next/server';
import { err, needSupa, ok, requireAdmin } from './api';

const TABLES = ['divisions', 'districts', 'upazilas', 'thanas', 'unions'] as const;
export type LocationTable = (typeof TABLES)[number];

/** Collection handlers: GET (public list via store getter) + POST (admin insert). */
export function locationCollection(
  table: LocationTable,
  getter: (parentId?: number) => Promise<unknown[]>,
  parentParam?: string
) {
  async function GET(req: NextRequest) {
    const raw = parentParam ? req.nextUrl.searchParams.get(parentParam) : null;
    const parentId = raw ? Number(raw) : undefined;
    return ok(await getter(parentId && !Number.isNaN(parentId) ? parentId : undefined));
  }

  async function POST(req: NextRequest) {
    if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
    const { supa, res } = needSupa();
    if (!supa) return res;
    const body = await req.json().catch(() => ({}));
    delete body.id;
    const { data, error } = await supa.from(table).insert(body).select().single();
    if (error) return err('সংরক্ষণ করা যায়নি');
    return ok(data, 201);
  }

  return { GET, POST };
}

/** Item handlers: PATCH + DELETE (admin only), matching the Phase-1 pattern. */
export function locationItem(table: LocationTable) {
  async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
    const { supa, res } = needSupa();
    if (!supa) return res;
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    delete body.id;
    const { data, error } = await supa.from(table).update(body).eq('id', id).select().single();
    if (error) return err('আপডেট করা যায়নি');
    return ok(data);
  }

  async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
    const { supa, res } = needSupa();
    if (!supa) return res;
    const { id } = await params;
    const { error } = await supa.from(table).delete().eq('id', id);
    if (error) return err('মোছা যায়নি');
    return ok({ ok: true });
  }

  return { PATCH, DELETE };
}
