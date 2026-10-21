import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import ReportsGrid from '@/components/ReportsGrid';
import SectionHeader from '@/components/SectionHeader';
import { IconChevronLeft, IconMegaphone } from '@/components/icons';
import { getCategories, getReports } from '@/lib/store';

export const dynamic = 'force-dynamic';

/** Phase 16 — dedicated all-reports page (linked from the home slider's "আরও দেখুন"). */
export default async function ReportsPage() {
  const [categories, reports] = await Promise.all([getCategories(), getReports()]);

  return (
    <>
      <Header />
      <main className="px-4 pb-10 pt-4 lg:px-6">
        <Link
          href="/"
          className="mb-3 flex min-h-11 w-fit items-center gap-1 text-sm font-bold text-ink-soft"
        >
          <IconChevronLeft className="h-4 w-4" />
          হোমে ফিরুন
        </Link>
        <SectionHeader
          gradient
          as="h1"
          icon={<IconMegaphone className="h-6 w-6" />}
          tileClassName="bg-red-100 text-brand"
          title="সব রিপোর্ট"
          subtitle="সব এলাকার সব রিপোর্ট — নতুন থেকে পুরনো ক্রমে"
        />
        <div className="mt-5">
          <ReportsGrid categories={categories} reports={reports} />
        </div>
      </main>
      <BottomNav />
    </>
  );
}
