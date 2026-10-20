import { err, ok, requireAdmin } from '@/lib/api';
import { breadcrumb, getAllMemberRows, locationNameMaps, rowToMember } from '@/lib/members-store';

/** Admin-only member list (includes phone — never expose this publicly). */
export async function GET() {
  if (!(await requireAdmin())) return err('অনুমতি নেই', 401);
  const [rows, maps] = await Promise.all([getAllMemberRows(), locationNameMaps()]);
  return ok(
    rows.map((r) => {
      const m = rowToMember(r);
      return {
        id: m.id,
        name: m.name,
        phone: m.phone,
        is_visible: m.is_visible,
        created_at: m.created_at,
        home_breadcrumb: breadcrumb(m.home, maps),
        current_breadcrumb: breadcrumb(m.current, maps),
        home: m.home,
        current: m.current,
      };
    })
  );
}
