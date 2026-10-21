'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import SectionHeader from '@/components/SectionHeader';
import { IconAlert, IconChevronRight, IconClock } from '@/components/icons';

interface Broadcast {
  id: number;
  title: string;
  body: string;
  scope_division_id: number | null;
  scope_district_id: number | null;
  scope_upazila_id: number | null;
  scope_thana_id: number | null;
  expires_at: string;
  created_at: string;
}

function isActive(b: Broadcast): boolean {
  return new Date(b.expires_at).getTime() > Date.now();
}

/**
 * Phase 9 — /broadcasts page.
 * Active broadcasts for the selected area (cascading picker) + a
 * "recently expired" section. Uses the SectionHeader pattern.
 */
export default function BroadcastsClient() {
  const [area, setArea] = useState<LocationSelection>(EMPTY_LOCATION);
  const [active, setActive] = useState<Broadcast[]>([]);
  const [expired, setExpired] = useState<Broadcast[]>([]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (area.division_id) qs.set('division_id', String(area.division_id));
    if (area.district_id) qs.set('district_id', String(area.district_id));
    if (area.upazila_id) qs.set('upazila_id', String(area.upazila_id));
    if (area.thana_id) qs.set('thana_id', String(area.thana_id));
    const url = qs.toString() ? `/api/broadcasts?${qs}` : '/api/broadcasts';
    fetch(url, { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setActive(d as Broadcast[]);
      })
      .catch(() => {});
  }, [area]);

  useEffect(() => {
    fetch('/api/broadcasts/expired', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setExpired((d as Broadcast[]).filter((b) => !isActive(b)));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <SectionHeader
          icon={<IconAlert className="h-6 w-6" />}
          tileClassName="bg-red-100 text-brand"
          title="জরুরি ঘোষণা"
          subtitle="আপনার এলাকার সক্রিয় সতর্কবার্তা"
        />
        <LocationPicker compact value={area} onChange={setArea} />
        <div className="space-y-2">
          {active.length === 0 && (
            <p className="rounded-2xl bg-surface border border-white/10 p-6 text-center text-sm text-ink-soft">
              এই এলাকায় এখন কোনো সক্রিয় ঘোষণা নেই। ✅
            </p>
          )}
          {active.map((b) => (
            <Link
              key={b.id}
              href={`/broadcasts/${b.id}`}
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-l from-red-600 to-red-700 p-4 text-white shadow-lg shadow-red-200"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <IconAlert className="h-5 w-5" />
              </span>
              <span className="flex min-h-11 flex-1 items-center gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">{b.title}</span>
                  <span className="block truncate text-xs text-white/85">{b.body}</span>
                </span>
                <IconChevronRight className="h-5 w-5 shrink-0" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {expired.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            icon={<IconClock className="h-6 w-6" />}
            tileClassName="bg-white/10 text-ink-soft"
            title="সম্প্রতি শেষ হওয়া"
            subtitle="মেয়াদ শেষ হওয়া পুরনো ঘোষণা"
          />
          <div className="space-y-2">
            {expired.slice(0, 5).map((b) => (
              <Link
                key={b.id}
                href={`/broadcasts/${b.id}`}
                className="block rounded-2xl bg-surface border border-white/10 p-4 opacity-75 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
              >
                <p className="text-sm font-bold text-ink">{b.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{b.body}</p>
                <p className="mt-1 text-[11px] font-semibold text-ink-soft">
                  মেয়াদ শেষ: {new Date(b.expires_at).toLocaleString('bn-BD')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
