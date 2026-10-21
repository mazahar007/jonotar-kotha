import BottomNav from '@/components/BottomNav';
import BroadcastBanner from '@/components/BroadcastBanner';
import Header from '@/components/Header';
import HomeFeed from '@/components/HomeFeed';
import { getCategories, getMunicipalityUpdates, getReports, getVolunteers } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, reports, volunteers, updates] = await Promise.all([
    getCategories(),
    getReports(),
    getVolunteers(),
    getMunicipalityUpdates(),
  ]);
  return (
    <>
      <Header />
      {/* Phase 9 — emergency broadcast banner (renders nothing when no active broadcast) */}
      <div className="pt-4">
        <BroadcastBanner />
      </div>
      <main className="pt-4">
        <HomeFeed categories={categories} reports={reports} volunteers={volunteers} updates={updates} />
      </main>
      <BottomNav />
    </>
  );
}
