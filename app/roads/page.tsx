import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadsExplorer from '@/components/RoadsExplorer';

export const dynamic = 'force-dynamic';

export default function RoadsPage() {
  return (
    <>
      <Header />
      <main className="px-4 pb-6 pt-4 lg:px-6">
        <h1 className="text-xl font-bold text-ink">রোড ও গুরুত্বপূর্ণ স্থান</h1>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          এলাকাভিত্তিক রোড ও গুরুত্বপূর্ণ মোড়/স্থানের লাইভ অবস্থা — কোথায় জ্যাম, ঝামেলা, বিদ্যুৎ আছে কি নেই, আপডেট দেখুন ও এক ট্যাপে নিজে জানান।
        </p>
        <RoadsExplorer variant="full" />
      </main>
      <BottomNav />
    </>
  );
}
