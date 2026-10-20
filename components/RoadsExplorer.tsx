'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import RoadCard from '@/components/RoadCard';
import { IconChevronRight, IconRoute } from '@/components/icons';
import { bnNum } from '@/lib/time';
import { ROAD_STATUSES, ROAD_STATUS_LABEL, type Road, type RoadKind, type RoadStatus } from '@/lib/types';

function queryOf(sel: LocationSelection, kind: RoadKind): string {
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

/**
 * Area-filtered road explorer: compact cascading area filter (defaults to
 * ময়মনসিংহ সদর via LocationPicker), status summary chips and road cards.
 * `home` variant = the dedicated হোম section; `full` variant = /roads page.
 */
export default function RoadsExplorer({ variant = 'full' }: { variant?: 'home' | 'full' }) {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [kind, setKind] = useState<RoadKind>('road');
  const [roads, setRoads] = useState<Road[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/roads${queryOf(area, kind)}`, { cache: 'no-store' });
        const data = await res.json();
        if (alive) setRoads(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setRoads([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [area, kind]);

  const summary = useMemo(() => {
    const counts = new Map<RoadStatus | 'none', number>();
    for (const r of roads ?? []) {
      const k = r.current_status ?? 'none';
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [roads]);

  const kindToggle = (
    <div className="flex rounded-full bg-cream p-1">
      {(
        [
          { value: 'road', label: 'রোডসমূহ' },
          { value: 'spot', label: 'মোড় ও স্থান' },
        ] as { value: RoadKind; label: string }[]
      ).map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => setKind(t.value)}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition ${
            kind === t.value ? 'bg-ink text-white shadow' : 'text-ink-soft'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const grid = (
    <>
      {kindToggle}

      {/* Area filter */}
      <div className="rounded-2xl bg-white p-3 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
        <p className="mb-2 px-1 text-xs font-bold text-ink-soft">এলাকা অনুযায়ী দেখুন</p>
        <LocationPicker compact value={area} onChange={setArea} />
      </div>

      {/* Status summary for the selected area + active tab */}
      {roads !== null && roads.length > 0 && (
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5">
          <span className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-xs font-bold text-white">
            {kind === 'road' ? `মোট ${bnNum(roads.length)}টি রোড` : `মোট ${bnNum(roads.length)}টি স্থান`}
          </span>
          {ROAD_STATUSES.map(
            (s) =>
              (summary.get(s) ?? 0) > 0 && (
                <span key={s} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-sm">
                  {ROAD_STATUS_LABEL[s]}: {bnNum(summary.get(s) ?? 0)}টি
                </span>
              )
          )}
          {(summary.get('none') ?? 0) > 0 && (
            <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink-soft shadow-sm">
              আপডেট নেই: {bnNum(summary.get('none') ?? 0)}টি
            </span>
          )}
        </div>
      )}

      {/* Road / spot cards */}
      {roads === null ? (
        <p className="py-8 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : roads.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-ink-soft">
          {kind === 'road'
            ? 'এই এলাকায় এখনো কোনো রোড যোগ হয়নি।'
            : 'এই এলাকায় এখনো কোনো গুরুত্বপূর্ণ স্থান যোগ হয়নি।'}
        </p>
      ) : (
        <div className={`grid gap-3 md:grid-cols-2 ${variant === 'full' ? 'xl:grid-cols-3' : ''}`}>
          {roads.map((r) => (
            <RoadCard key={r.id} road={r} />
          ))}
        </div>
      )}
    </>
  );

  if (variant === 'full') return <div className="space-y-4">{grid}</div>;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-700">
              <IconRoute className="h-5 w-5" />
            </span>
            রোডের অবস্থা
          </h2>
          <p className="mt-1 text-xs text-ink-soft">এলাকাভিত্তিক লাইভ আপডেট — কোন রোডের কী অবস্থা</p>
        </div>
        <Link href="/roads" className="flex shrink-0 items-center gap-0.5 text-sm font-bold text-brand">
          সব রোড দেখুন <IconChevronRight className="h-4 w-4" />
        </Link>
      </div>
      {grid}
    </section>
  );
}
