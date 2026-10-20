import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadsExplorer from '@/components/RoadsExplorer';
import SectionHeader from '@/components/SectionHeader';
import { IconRoute } from '@/components/icons';

export const dynamic = 'force-dynamic';

export default function RoadsPage() {
  return (
    <>
      <Header />
      <main className="px-4 pb-6 pt-4 lg:px-6">
        <SectionHeader
          as="h1"
          icon={<IconRoute className="h-6 w-6" />}
          tileClassName="bg-orange-100 text-orange-700"
          title="রোড ও গুরুত্বপূর্ণ স্থান"
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
