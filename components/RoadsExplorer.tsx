'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CardSlider from '@/components/CardSlider';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import QuickPostStrip from '@/components/QuickPostStrip';
import RoadCard from '@/components/RoadCard';
import SectionHeader, { SectionActionLink } from '@/components/SectionHeader';
import { IconChevronRight, IconRoute } from '@/components/icons';
import { bnNum } from '@/lib/time';
import SafetyScoreChip from '@/components/SafetyScoreChip';
import { ROAD_STATUSES, ROAD_STATUS_LABEL, type Road, type RoadStatus } from '@/lib/types';

type StatusFilter = RoadStatus | 'none' | null;

function queryOf(sel: LocationSelection): string {
  const p = new URLSearchParams();
  if (sel.division_id) p.set('division_id', String(sel.division_id));
  if (sel.district_id) p.set('district_id', String(sel.district_id));
  if (sel.upazila_id) p.set('upazila_id', String(sel.upazila_id));
  if (sel.thana_id) p.set('thana_id', String(sel.thana_id));
  if (sel.union_id) p.set('union_id', String(sel.union_id));
  const q = p.toString();
  return q ? `?${q}` : '';
}

async function fetchAll(area: LocationSelection): Promise<Road[]> {
  try {
    // Phase 17 — no ?kind=: roads + spots are ONE merged list.
    const res = await fetch(`/api/roads${queryOf(area)}`, { cache: 'no-store' });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Phase 17 — roads + spots are THE SAME thing (user: "কারণ এটা একি জিনিস").
 * ONE section, ONE list, ONE chip row, ONE area filter. Spots carry a small
 * "📍 মোড়" badge on the card (RoadCard). `home` variant: big-card slider of
 * the 10 most recently updated + one big See More → /roads. `full` variant
 * (the /roads page): the whole combined list as a grid.
 */
export default function RoadsExplorer({ variant = 'full' }: { variant?: 'home' | 'full' }) {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [items, setItems] = useState<Road[] | null>(null);
  const [filter, setFilter] = useState<StatusFilter>(null);

  const load = useCallback(async (a: LocationSelection) => {
    setItems(await fetchAll(a));
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const list = await fetchAll(area);
      if (alive) {
        setItems(list);
        setFilter(null); // new area data → clear filter
      }
    })();
    return () => {
      alive = false;
    };
  }, [area]);

  const refetch = useCallback(() => {
    void load(area);
  }, [load, area]);

  const counts = useMemo(() => {
    // Phase 18 — a road counts toward EVERY status in its current_statuses.
    const map = new Map<RoadStatus | 'none', number>();
    for (const r of items ?? []) {
      if (r.current_statuses.length === 0) {
        map.set('none', (map.get('none') ?? 0) + 1);
      } else {
        for (const s of r.current_statuses) map.set(s, (map.get(s) ?? 0) + 1);
      }
    }
    return map;
  }, [items]);

  const visible = useMemo(() => {
    if (!items) return null;
    if (filter === null) return items;
    if (filter === 'none') return items.filter((r) => r.current_statuses.length === 0);
    // Phase 18 — match if ANY of the road's current statuses matches.
    return items.filter((r) => r.current_statuses.includes(filter));
  }, [items, filter]);

  // Liveliest first (latest update desc); slider shows the top 10.
  const sorted = useMemo(() => {
    if (!visible) return null;
    return [...visible].sort((a, b) => {
      const at = a.latest_update ? new Date(a.latest_update.created_at).getTime() : 0;
      const bt = b.latest_update ? new Date(b.latest_update.created_at).getTime() : 0;
      return bt - at;
    });
  }, [visible]);

  const isHome = variant === 'home';
  const display = sorted == null ? null : isHome ? sorted.slice(0, 10) : sorted;
  const gridClassName = `grid gap-3 md:grid-cols-2 ${isHome ? '' : 'xl:grid-cols-3'}`;

  const chipCls = (active: boolean) =>
    `flex min-h-11 shrink-0 cursor-pointer items-center rounded-full px-3.5 text-xs font-bold shadow-sm transition ${
      active ? 'bg-ink text-white' : 'bg-white text-ink hover:bg-cream-dark'
    }`;

  const body = (
    <>
      {/* One-tap post strip at section top */}
      <QuickPostStrip onPosted={refetch} />

      {/* Shared area filter */}
      <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-2 px-1 text-xs font-bold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      {/* One status-filter chip row for the merged list */}
      {items !== null && items.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
          <button
            type="button"
            onClick={() => setFilter(null)}
            aria-pressed={filter === null}
            className={chipCls(filter === null)}
          >
            মোট {bnNum(items.length)}টি জায়গা
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
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
          এই এলাকায় এখনো কোনো রোড বা মোড় যোগ হয়নি।
        </p>
      ) : display.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
          এই অবস্থায় কোনো জায়গা নেই।
        </p>
      ) : isHome ? (
        <>
          <CardSlider
            items={display}
            keyOf={(r) => r.id}
            ariaLabel="রোড ও মোড়ের অবস্থা স্লাইডার"
            renderCard={(r) => <RoadCard road={r} interactive={false} />}
          />
          <Link
            href="/roads"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-lg font-bold text-white shadow-[0_2px_12px_rgba(0,0,0,0.12)] transition hover:bg-stone-800"
          >
            আরও দেখুন
            <IconChevronRight className="h-5 w-5" />
          </Link>
        </>
      ) : (
        <div className={gridClassName}>
          {display.map((r) => (
            <RoadCard key={r.id} road={r} />
          ))}
        </div>
      )}
    </>
  );

  if (!isHome) return <div className="space-y-6">{body}</div>;

  return (
    <section className="space-y-5">
      <SectionHeader
        icon={<IconRoute className="h-6 w-6" />}
        tileClassName="bg-orange-100 text-orange-700"
        title="রোড ও মোড়ের অবস্থা"
        subtitle="রাস্তা ও গুরুত্বপূর্ণ মোড়ের লাইভ অবস্থা"
        action={
          <span className="flex items-center gap-2">
            <SafetyScoreChip area={area} />
            <SectionActionLink href="/roads">সব দেখুন</SectionActionLink>
          </span>
        }
      />
      <div className="space-y-6">{body}</div>
    </section>
  );
}
