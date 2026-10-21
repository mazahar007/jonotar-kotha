import Link from 'next/link';
import { notFound } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import ReportCard from '@/components/ReportCard';
import ReportComments from '@/components/ReportComments';
import SectionHeader from '@/components/SectionHeader';
import VerifyButton from '@/components/VerifyButton';
import { IconMegaphone } from '@/components/icons';
import { getReports } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Phase 7 — report detail: full report + "আমিও দেখেছি" + comments. */
export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reportId = Number(id);
  if (!Number.isFinite(reportId)) notFound();
  const reports = await getReports();
  const report = reports.find((r) => r.id === reportId);
  if (!report) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-10 lg:px-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center text-sm font-bold text-brand"
        >
          ← সব রিপোর্টে ফিরুন
        </Link>

        <SectionHeader
          as="h1"
          icon={<IconMegaphone className="h-6 w-6" />}
          title={report.title}
          subtitle="রিপোর্টের বিস্তারিত, যাচাই ভোট ও মন্তব্য"
        />

        <ReportCard report={report} />
        <VerifyButton reportId={report.id} variant="full" />
        <ReportComments reportId={report.id} />
      </main>
      <BottomNav />
    </>
  );
}
