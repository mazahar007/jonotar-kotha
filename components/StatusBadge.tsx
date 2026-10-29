import type { ReportStatus } from '@/lib/types';
import { STATUS_LABEL } from '@/lib/types';

const styles: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-300',
  verified: 'bg-emerald-500/15 text-emerald-300',
  in_progress: 'bg-sky-500/15 text-sky-300',
  resolved: 'bg-teal-500/15 text-teal-300',
  urgent: 'bg-red-500/15 text-red-300',
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
