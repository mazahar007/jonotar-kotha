'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import RoadCard from '@/components/RoadCard';
import SectionHeader, { SectionActionLink } from '@/components/SectionHeader';
import { IconPin, IconRoute } from '@/components/icons';
import { bnNum } from '@/lib/time';
import SafetyScoreChip from '@/components/SafetyScoreChip';
import { ROAD_STATUSES, ROAD_STATUS_LABEL, type Road, type RoadStatus } from '@/lib/types';

type StatusFilter = RoadStatus | 'none' | null;

function queryOf(sel: LocationSelection, kind: 'road' | 'spot'): string {
  const p = new URLSearchParams();
  p.set('kind', kind);
  if (sel.division_id) p.set('division_id', String(sel.division_id));
  if (sel.district_id) p.set('district_id', String(sel.district_id));
  if (sel.upazila_id) p.set('upazila_id', String(sel.upazila_id));
  if (sel.thana_id) p.set('thana_id', String(sel.thana_id));
  if (sel.union_id) p.set('union_id', String(sel.union_id));
  const q = p.toString();
  return q ? `?${q}` : '';
}

async function fetchRoads(area: LocationSelection, kind: 'road' | 'spot'): Promise<Road[]> {
  try {
    const res = await fetch(`/api/roads${queryOf(area, kind)}`, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * One kind group (রোডসমূহ / মোড় ও গুরুত্বপূর্ণ স্থান): own SectionHeader,
 * clickable status summary chips that FILTER this group's cards, and the
 * card grid. Chip counts always come from the group's full (unfiltered)
 * list for the selected area; tapping the active chip — or the মোট chip —
 * clears the filter.
 */
function RoadGroup({
  icon,
  tileClassName,
  title,
  subtitle,
  items,
  totalLabel,
  emptyText,
  gridClassName,
  headerAction,
}: {
  icon: ReactNode;
  tileClassName: string;
  title: string;
  subtitle: string;
  items: Road[] | null;
  totalLabel: string;
  emptyText: string;
  gridClassName: string;
  headerAction?: ReactNode;
}) {
  const [filter, setFilter] = useState<StatusFilter>(null);

  // New area data → back to showing everything.
  useEffect(() => {
    setFilter(null);
  }, [items]);

  const counts = useMemo(() => {
    const map = new Map<RoadStatus | 'none', number>();
    for (const r of items ?? []) {
      const k = r.current_status ?? 'none';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const visible = useMemo(() => {
    if (!items) return null;
    if (filter === null) return items;
    if (filter === 'none') return items.filter((r) => !r.current_status);
    return items.filter((r) => r.current_status === filter);
  }, [items, filter]);

  const chipCls = (active: boolean) =>
    `flex min-h-11 shrink-0 cursor-pointer items-center rounded-full px-3.5 text-xs font-bold shadow-sm transition ${
      active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-cream-dark'
    }`;

  return (
    <section className="space-y-4">
      <SectionHeader icon={icon} tileClassName={tileClassName} title={title} subtitle={subtitle} action={headerAction} />

      {items !== null && items.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
          <button
            type="button"
            onClick={() => setFilter(null)}
            aria-pressed={filter === null}
            className={chipCls(filter === null)}
          >
            মোট {bnNum(items.length)}টি {totalLabel}
          </button>
          {ROAD_STATUSES.map(
            (s) =>
              (counts.get(s) ?? 0) > 0 && (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(filter === s ? null : s)}
                  aria-pressed={filter === s}
                  className={chipCls(filter === s)}
                >
                  {ROAD_STATUS_LABEL[s]}: {bnNum(counts.get(s) ?? 0)}টি
                </button>
              )
          )}
          {(counts.get('none') ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => setFilter(filter === 'none' ? null : 'none')}
              aria-pressed={filter === 'none'}
              className={chipCls(filter === 'none')}
            >
              আপডেট নেই: {bnNum(counts.get('none') ?? 0)}টি
            </button>
          )}
        </div>
      )}

      {visible === null ? (
        <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : items !== null && items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">{emptyText}</p>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
          এই অবস্থায় কোনো {totalLabel} নেই।
        </p>
      ) : (
        <div className={gridClassName}>
          {visible.map((r) => (
            <RoadCard key={r.id} road={r} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Area-filtered road explorer: ONE shared cascading area filter (defaults
 * to ময়মনসিংহ সদর via LocationPicker), then TWO clearly separated sections —
 * রোডসমূহ and মোড় ও গুরুত্বপূর্ণ স্থান — each with its own header, clickable
 * status-filter chips and cards. `home` variant adds the umbrella
 * "রোডের অবস্থা" header; `full` variant is the /roads page body.
 */
export default function RoadsExplorer({ variant = 'full' }: { variant?: 'home' | 'full' }) {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [roads, setRoads] = useState<Road[] | null>(null);
  const [spots, setSpots] = useState<Road[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, s] = await Promise.all([fetchRoads(area, 'road'), fetchRoads(area, 'spot')]);
      if (alive) {
        setRoads(r);
        setSpots(s);
      }
    })();
    return () => {
      alive = false;
    };
  }, [area]);

  const gridClassName = `grid gap-3 md:grid-cols-2 ${variant === 'full' ? 'xl:grid-cols-3' : ''}`;

  const body = (
    <>
      {/* Shared area filter */}
      <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-2 px-1 text-xs font-bold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      <RoadGroup
        icon={<IconRoute className="h-6 w-6" />}
        tileClassName="bg-orange-100 text-orange-700"
        title="রোডসমূহ"
        subtitle="কোন রোডের কী অবস্থা — লাইভ আপডেট"
        items={roads}
        totalLabel="রোড"
        emptyText="এই এলাকায় এখনো কোনো রোড যোগ হয়নি।"
        gridClassName={gridClassName}
        headerAction={<SafetyScoreChip area={area} />}
      />

      <RoadGroup
        icon={<IconPin className="h-6 w-6" />}
        tileClassName="bg-violet-100 text-violet-700"
        title="মোড় ও গুরুত্বপূর্ণ স্থান"
        subtitle="মোড় ও গুরুত্বপূর্ণ জায়গার লাইভ অবস্থা"
        items={spots}
        totalLabel="স্থান"
        emptyText="এই এলাকায় এখনো কোনো গুরুত্বপূর্ণ স্থান যোগ হয়নি।"
        gridClassName={gridClassName}
      />
    </>
  );

  if (variant === 'full') return <div className="space-y-8">{body}</div>;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={<IconRoute className="h-6 w-6" />}
        tileClassName="bg-orange-100 text-orange-700"
        title="রোডের অবস্থা"
        subtitle="রাস্তা ও গুরুত্বপূর্ণ মোড়ের লাইভ অবস্থা"
        action={<SectionActionLink href="/roads">সব রোড দেখুন</SectionActionLink>}
      />
      <div className="space-y-8">{body}</div>
    </section>
  );
}
