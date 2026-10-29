import type { Report, Volunteer } from '@/lib/types';
import { bnNum } from '@/lib/time';
import { IconCheck, IconMegaphone, IconShield, IconUsers } from './icons';

/**
 * Phase 22 — the zilaseba reference's stats bar (4 cells, hairline
 * dividers, tinted icon tiles). Only real counts from the current data —
 * no invented numbers.
 */
export default function HomeStatsStrip({
  reports,
  volunteers,
  grid = false,
}: {
  reports: Report[];
  volunteers: Volunteer[];
  /** Phase 23 — always 2×2 (for a half-width column) instead of a 4-wide bar on lg. */
  grid?: boolean;
}) {
  const verified = reports.filter((r) => r.status === 'verified' || r.status === 'in_progress').length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const stats = [
    { value: reports.length, unit: 'টি', label: 'মোট রিপোর্ট', sub: 'নাগরিকদের পাঠানো', Icon: IconMegaphone, tile: 'bg-blue-500/10 text-blue-400', unitCls: 'text-blue-400' },
    { value: verified, unit: 'টি', label: 'যাচাইকৃত ও চলমান', sub: 'কাজ চলছে বা যাচাই হয়েছে', Icon: IconCheck, tile: 'bg-emerald-500/10 text-emerald-400', unitCls: 'text-emerald-400' },
    { value: resolved, unit: 'টি', label: 'সমাধান হয়েছে', sub: 'পৌরসভা ব্যবস্থা নিয়েছে', Icon: IconShield, tile: 'bg-violet-500/10 text-violet-300', unitCls: 'text-violet-300' },
    { value: volunteers.length, unit: ' জন', label: 'স্বেচ্ছাসেবক', sub: 'এলাকার পাশে আছেন', Icon: IconUsers, tile: 'bg-amber-500/10 text-amber-400', unitCls: 'text-amber-400' },
  ];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-overlay">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/[0.04] via-transparent to-brand-dark/[0.04]" />
      <dl className={`relative grid grid-cols-2 ${grid ? '' : 'lg:grid-cols-4'}`}>
        {stats.map(({ value, unit, label, sub, Icon, tile, unitCls }, i) => (
          <div
            key={label}
            className={`group flex flex-col items-center gap-y-3 px-4 text-center transition-colors duration-300 hover:bg-overlay sm:px-8 ${
              grid ? 'py-6' : 'py-8'
            } ${i % 2 === 1 ? 'border-l border-line' : ''} ${
              i >= 2 ? (grid ? 'border-t border-line' : 'border-t border-line lg:border-t-0') : ''
            } ${i === 2 && !grid ? 'lg:border-l' : ''}`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${tile}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <dd className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {bnNum(value)}
                <span className={`text-2xl sm:text-3xl ${unitCls}`}>{unit}</span>
              </dd>
              <dt className="mt-1 text-sm font-medium text-ink">{label}</dt>
              <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
