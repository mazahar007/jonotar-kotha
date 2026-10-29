'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CardSlider from '@/components/CardSlider';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import QuickPostStrip from '@/components/QuickPostStrip';
import RoadCard from '@/components/RoadCard';
import RoadPager from '@/components/RoadPager';
import SampleSectionHead from '@/components/SampleSectionHead';
import { IconChevronRight } from '@/components/icons';
import { ROAD_STATUS_META } from '@/lib/road-status';
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
  // Phase 24 — desktop home uses the paged 2-up grid; phones keep the swipe slider.
  const [isLg, setIsLg] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  /* Phase 25 — a selected status chip takes that status's own colour
     (ভালো → green, যানজট → orange …); "মোট" keeps the brand gradient. */
  const chipCls = (active: boolean, status?: RoadStatus) =>
    `flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
      isHome ? 'lg:min-h-9' : ''
    } ${
      !active
        ? 'border-line bg-surface text-ink hover:bg-cream-dark'
        : status
          ? `${ROAD_STATUS_META[status].dot} border-white/20 text-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.5)]`
          : 'btn-gradient border-transparent text-white'
    }`;

  /* One-tap post strip at section top */
  const quickPost = <QuickPostStrip onPosted={refetch} />;

  const filters = (
    <>
      {/* Shared area filter */}
      <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <p className="mb-3 text-xs font-semibold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      {/* One status-filter chip row for the merged list */}
      {items !== null && items.length > 0 && (
        <div className={`no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-2 ${isHome ? 'lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:py-0' : ''}`}>
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
                  className={chipCls(filter === s, s)}
                >
                  {filter !== s && <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${ROAD_STATUS_META[s].dot}`} />}
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
    </>
  );

  const list = (
    <>
      {display === null ? (
        <p className="py-6 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : items !== null && items.length === 0 ? (
        <p className="rounded-2xl bg-surface border border-line p-6 text-center text-sm text-ink-soft">
          এই এলাকায় এখনো কোনো রোড বা মোড় যোগ হয়নি।
        </p>
      ) : display.length === 0 ? (
        <p className="rounded-2xl bg-surface border border-line p-6 text-center text-sm text-ink-soft">
          এই অবস্থায় কোনো জায়গা নেই।
        </p>
      ) : isHome && isLg ? (
        <RoadPager roads={display} />
      ) : isHome ? (
        <CardSlider
          items={display}
          keyOf={(r) => r.id}
          ariaLabel="রোড ও মোড়ের অবস্থা স্লাইডার"
          cardClass="w-[88%] sm:w-[70%] md:w-[calc(50%-6px)]"
          renderCard={(r) => <RoadCard road={r} interactive={false} />}
        />
      ) : (
        <div className={gridClassName}>
          {display.map((r) => (
            <RoadCard key={r.id} road={r} />
          ))}
        </div>
      )}
    </>
  );

  if (!isHome)
    return (
      <div className="space-y-6">
        {quickPost}
        {filters}
        {list}
      </div>
    );

  /* Phase 25 — home on lg is a 2×2 grid so the boxes line up (user: the
     cards box must match the left box): row 1 = heading | area filter +
     chips, row 2 = one-tap post | cards box (equal height, stretched).
     Phones read: heading → one-tap post → filter + chips → cards. */
  return (
    <section className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)] lg:gap-x-10 lg:gap-y-6">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
        <SampleSectionHead
          badge="রাস্তা"
          color="amber"
          title="রোড ও মোড়ের"
          gradient="লাইভ অবস্থা"
          subtext="কোথায় জ্যাম, কোথায় রাস্তা ভাঙা, বিদ্যুৎ আছে কি নেই — এক ট্যাপে জানুন ও জানান।"
          size="page"
          stacked
        />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <SafetyScoreChip area={area} />
          <Link
            href="/roads"
            className="group inline-flex min-h-11 items-center gap-x-1.5 rounded-xl border border-line-strong px-5 text-sm font-semibold text-ink transition-all duration-300 hover:bg-overlay"
          >
            সব রোড ও মোড় দেখুন
            <IconChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
      <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:[&>*]:h-full">{quickPost}</div>
      <div className="flex min-w-0 flex-col gap-5 lg:col-start-2 lg:row-start-1 lg:self-end">{filters}</div>
      <div className="flex min-w-0 flex-col lg:col-start-2 lg:row-start-2">{list}</div>
    </section>
  );
}
