import type { ReportStatus } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

const styles: Record<ReportStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  verified: 'bg-emerald-100 text-emerald-800',
  in_progress: 'bg-sky-100 text-sky-800',
  resolved: 'bg-teal-100 text-teal-800',
  urgent: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {status === 'urgent' && <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-red-600" />}
      {STATUS_LABEL[status]}
    </span>
  );
}
