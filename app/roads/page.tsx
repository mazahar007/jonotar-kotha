import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadsExplorer from '@/components/RoadsExplorer';
import SectionHeader from '@/components/SectionHeader';
import { IconRoute } from '@/components/icons';

export const dynamic = 'force-dynamic';

/**
 * Phase 17 — roads + spots are ONE merged list ("কারণ এটা একি জিনিস"):
 * no ?kind= split anymore, one combined list with one filter row.
 */
export default function RoadsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4">
        <SectionHeader
          gradient
          as="h1"
          icon={<IconRoute className="h-6 w-6" />}
          tileClassName="bg-orange-500/15 text-orange-300"
          title="রোড ও মোড়ের অবস্থা"
          subtitle="রাস্তা ও গুরুত্বপূর্ণ মোড়ের লাইভ অবস্থা"
        />
        <p className="mb-5 mt-3 text-sm text-ink-soft">
          এলাকাভিত্তিক রোড ও গুরুত্বপূর্ণ মোড়/স্থানের লাইভ অবস্থা — কোথায় জ্যাম, ঝামেলা, বিদ্যুৎ আছে কি নেই, আপডেট দেখুন ও এক ট্যাপে নিজে জানান।
        </p>
        <RoadsExplorer variant="full" />
      </main>
      <BottomNav />
    </>
  );
}
