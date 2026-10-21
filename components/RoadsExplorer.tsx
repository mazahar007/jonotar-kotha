'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import CardSlider from '@/components/CardSlider';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import QuickPostStrip from '@/components/QuickPostStrip';
import RoadCard from '@/components/RoadCard';
import SectionHeader, { SectionActionLink } from '@/components/SectionHeader';
import { IconChevronRight, IconPin, IconRoute } from '@/components/icons';
import { bnNum } from '@/lib/time';
import SafetyScoreChip from '@/components/SafetyScoreChip';
import { ROAD_STATUSES, ROAD_STATUS_LABEL, type Road, type RoadKind, type RoadStatus } from '@/lib/types';

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

/** Phase 14 — sub-group header inside the merged section (NOT a SectionHeader:
    the whole explorer is ONE section with one SectionHeader). */
function SubGroupHeader({
  icon,
  tileClassName,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  tileClassName: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tileClassName}`}
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
        <p className="text-xs text-ink-soft">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * One kind group inside the merged section: sub-group header, clickable
 * status summary chips that FILTER this group's cards, and the card grid.
 * Chip counts always come from the group's full (unfiltered) list for the
 * selected area; tapping the active chip — or the মোট chip — clears the filter.
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
  slider = false,
  seeMoreHref,
  seeMoreLabel,
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
  /** Phase 16 — slider mode: latest 10 by latest update + big See More button. */
  slider?: boolean;
  seeMoreHref?: string;
  seeMoreLabel?: string;
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

  // Phase 16 — slider shows the 10 most recently updated (filtered set when a chip is active).
  const display = useMemo(() => {
    if (!visible) return null;
    const sorted = [...visible].sort((a, b) => {
      const at = a.latest_update ? new Date(a.latest_update.created_at).getTime() : 0;
      const bt = b.latest_update ? new Date(b.latest_update.created_at).getTime() : 0;
      return bt - at;
    });
    return slider ? sorted.slice(0, 10) : sorted;
  }, [visible, slider]);

  const chipCls = (active: boolean) =>
    `flex min-h-11 shrink-0 cursor-pointer items-center rounded-full px-3.5 text-xs font-bold shadow-sm transition ${
      active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-cream-dark'
    }`;

  return (
    <section className="space-y-4" aria-label={title}>
      <SubGroupHeader
        icon={icon}
        tileClassName={tileClassName}
        title={title}
        subtitle={subtitle}
        action={headerAction}
      />

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

      {display === null ? (
        <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : items !== null && items.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">{emptyText}</p>
      ) : display.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
          এই অবস্থায় কোনো {totalLabel} নেই।
        </p>
      ) : slider ? (
        <>
          <CardSlider
            items={display}
            keyOf={(r) => r.id}
            ariaLabel={`${title} স্লাইডার`}
            renderCard={(r) => <RoadCard road={r} />}
          />
          {seeMoreHref && seeMoreLabel && (
            <Link
              href={seeMoreHref}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition hover:bg-stone-800"
            >
              {seeMoreLabel}
              <IconChevronRight className="h-5 w-5" />
            </Link>
          )}
        </>
      ) : (
        <div className={gridClassName}>
          {display.map((r) => (
            <RoadCard key={r.id} road={r} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Phase 14 — ONE merged section "রোড ও মোড়ের অবস্থা": a single SectionHeader,
 * the "⚡ এক ট্যাপে জানান" strip, ONE shared cascading area filter, then two
 * clearly-labeled sub-groups — 🛣️ রোডসমূহ and 📍 মোড় ও গুরুত্বপূর্ণ স্থান.
 * No tabs (per the user's earlier complaint). `home` variant adds the
 * umbrella header + link; `full` variant is the /roads page body.
 * Phase 16 — `home` variant shows each sub-group as a big-card slider
 * (latest 10) with a big See More button; `initialKind` (from ?kind= on
 * /roads) shows only that sub-group in full grid form.
 */
export default function RoadsExplorer({
  variant = 'full',
  initialKind = null,
}: {
  variant?: 'home' | 'full';
  initialKind?: RoadKind | null;
}) {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [roads, setRoads] = useState<Road[] | null>(null);
  const [spots, setSpots] = useState<Road[] | null>(null);

  const load = useCallback(async (a: LocationSelection) => {
    const [r, s] = await Promise.all([fetchRoads(a, 'road'), fetchRoads(a, 'spot')]);
    setRoads(r);
    setSpots(s);
  }, []);

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

  const refetch = useCallback(() => {
    void load(area);
  }, [load, area]);

  const gridClassName = `grid gap-3 md:grid-cols-2 ${variant === 'full' ? 'xl:grid-cols-3' : ''}`;
  const isHome = variant === 'home';
  const showRoads = !initialKind || initialKind === 'road';
  const showSpots = !initialKind || initialKind === 'spot';

  const body = (
    <>
      {/* One-tap post strip at section top */}
      <QuickPostStrip onPosted={refetch} />

      {/* Shared area filter */}
      <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-2 px-1 text-xs font-bold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      {/* Sub-group A — roads */}
      {showRoads && (
        <RoadGroup
          icon={<IconRoute className="h-5 w-5" />}
          tileClassName="bg-orange-100 text-orange-700"
          title="🛣️ রোডসমূহ"
          subtitle="কোন রোডের কী অবস্থা — লাইভ আপডেট"
          items={roads}
          totalLabel="রোড"
          emptyText="এই এলাকায় এখনো কোনো রোড যোগ হয়নি।"
          gridClassName={gridClassName}
          headerAction={<SafetyScoreChip area={area} />}
          slider={isHome}
          seeMoreHref="/roads?kind=road"
          seeMoreLabel="আরও রোড দেখুন"
        />
      )}

      {/* Sub-group B — spots / মোড় */}
      {showSpots && (
        <RoadGroup
          icon={<IconPin className="h-5 w-5" />}
          tileClassName="bg-violet-100 text-violet-700"
          title="📍 মোড় ও গুরুত্বপূর্ণ স্থান"
          subtitle="মোড় ও গুরুত্বপূর্ণ জায়গার লাইভ অবস্থা"
          items={spots}
          totalLabel="স্থান"
          emptyText="এই এলাকায় এখনো কোনো গুরুত্বপূর্ণ স্থান যোগ হয়নি।"
          gridClassName={gridClassName}
          slider={isHome}
          seeMoreHref="/roads?kind=spot"
          seeMoreLabel="আরও স্থান দেখুন"
        />
      )}
    </>
  );

  if (variant === 'full') return <div className="space-y-6">{body}</div>;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={<IconRoute className="h-6 w-6" />}
        tileClassName="bg-orange-100 text-orange-700"
        title="রোড ও মোড়ের অবস্থা"
        subtitle="রাস্তা ও গুরুত্বপূর্ণ মোড়ের লাইভ অবস্থা"
        action={<SectionActionLink href="/roads">সব রোড দেখুন</SectionActionLink>}
      />
      <div className="space-y-6">{body}</div>
    </section>
  );
}
