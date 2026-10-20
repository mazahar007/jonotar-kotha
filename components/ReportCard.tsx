import type { Report } from '@/lib/types';
import { IconClock, IconEye, IconPin } from './icons';
import StatusBadge from './StatusBadge';

function distanceLabel(m: number | null): string {
  if (m == null) return '';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} কিমি`;
  return `${m}মি`;
}

export default function ReportCard({ report }: { report: Report }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold text-ink-soft">
          {report.category}
        </span>
        <StatusBadge status={report.status} />
        {report.is_anonymous && (
          <span className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
            <IconEye className="h-3.5 w-3.5" />
            গোপন বাক্স
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-bold leading-snug text-ink">{report.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{report.description}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <IconPin className="h-3.5 w-3.5" />
          {report.location_name}
          {report.distance_m != null && `, ${distanceLabel(report.distance_m)}`}
        </span>
        <span className="flex items-center gap-1">
          <IconClock className="h-3.5 w-3.5" />
          {report.time_ago}
        </span>
      </div>
    </article>
  );
}
