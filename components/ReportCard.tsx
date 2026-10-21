import Link from 'next/link';
import type { Report } from '@/lib/types';
import { IconClock, IconEye, IconPin } from './icons';
import LikeButton from './LikeButton';
import StatusBadge from './StatusBadge';
import VerifyButton from './VerifyButton';

function distanceLabel(m: number | null): string {
  if (m == null) return '';
  if (m >= 1000) return `${(m / 1000).toFixed(1)} কিমি`;
  return `${m}মি`;
}

const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXT.some((e) => clean.endsWith(e));
}

export default function ReportCard({ report, large = false }: { report: Report; large?: boolean }) {
  const media = (report.media_urls ?? []).filter(Boolean);
  const images = media.filter((u) => !isVideoUrl(u));
  const videos = media.filter((u) => isVideoUrl(u));
  const breadcrumb = [report.union_name, report.upazila_name, report.district_name].filter(Boolean) as string[];

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-surface border border-line shadow-[0_2px_12px_rgba(0,0,0,0.05)] ${
        large ? 'flex h-full flex-col' : ''
      }`}
    >
      {/* Cover: first uploaded photo */}
      {images.length > 0 && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={images[0]} alt="" className={`${large ? 'h-52' : 'h-44'} w-full object-cover`} loading="lazy" />
      )}

      <div className={large ? 'flex flex-1 flex-col p-5 lg:p-6' : 'p-4'}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-cream-dark px-2.5 py-1 text-xs font-semibold text-ink-soft">
            {report.category}
          </span>
          <StatusBadge status={report.status} />
          {report.is_anonymous && (
            <span className="flex items-center gap-1 rounded-full bg-overlay px-2.5 py-1 text-xs font-semibold text-ink-soft">
              <IconEye className="h-3.5 w-3.5" />
              গোপন বাক্স
            </span>
          )}
        </div>
        <h3 className={`${large ? 'text-xl' : 'text-[15px]'} font-bold leading-snug text-ink`}>
          {report.title}
        </h3>
        <p
          className={`leading-relaxed text-ink-soft ${
            large ? 'mt-2 line-clamp-3 text-[15px]' : 'mt-1.5 text-sm'
          }`}
        >
          {report.description}
        </p>

        {/* Extra photos as a thumbnail row */}
        {images.length > 1 && (
          <div className="mt-3 flex gap-2">
            {images.slice(1, 4).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={u} alt="" className="h-16 w-16 rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}

        {/* Uploaded videos with native controls */}
        {videos.map((u) => (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video key={u} src={u} controls preload="metadata" className="mt-3 w-full rounded-xl" />
        ))}

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

        {/* Administrative hierarchy breadcrumb: ইউনিয়ন, উপজেলা, জেলা */}
        {breadcrumb.length > 0 && (
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-ink-soft">
            <IconPin className="h-3.5 w-3.5 text-brand" />
            {breadcrumb.join(', ')}
          </p>
        )}
        {/* Phase 7 — verify votes + link to detail/comments; Phase 15 — like */}
        <div
          className={`flex items-center justify-between gap-2 border-t border-line pt-3 ${
            large ? 'mt-auto' : 'mt-3'
          }`}
        >
          <div className="flex items-center gap-2">
            <VerifyButton reportId={report.id} variant="compact" />
            <LikeButton targetType="report" targetId={report.id} />
          </div>
          <Link
            href={`/reports/${report.id}`}
            className="flex min-h-[44px] items-center text-sm font-bold text-brand"
          >
            বিস্তারিত ও মন্তব্য →
          </Link>
        </div>
      </div>
    </article>
  );
}
