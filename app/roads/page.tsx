import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadsExplorer from '@/components/RoadsExplorer';

export const dynamic = 'force-dynamic';

export default function RoadsPage() {
  return (
    <>
      <Header />
      <main className="px-4 pb-6 pt-4 lg:px-6">
        <h1 className="text-xl font-bold text-ink">রোডের অবস্থা</h1>
        <p className="mb-4 mt-1 text-sm text-ink-soft">
          এলাকাভিত্তিক রোডের লাইভ অবস্থা — কোন রোড ভালো, কোথায় ভাঙা বা যানজট, আপডেট দেখুন ও নিজে আপডেট দিন।
        </p>
        <RoadsExplorer variant="full" />
      </main>
      <BottomNav />
    </>
  );
}
