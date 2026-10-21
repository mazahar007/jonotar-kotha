import BottomNav from '@/components/BottomNav';
import EmergencyStrip from '@/components/EmergencyStrip';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
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
      {/* Phase 21d — overlay header: fixed pill floating over the hero,
          whose background spans the full viewport from the top edge. */}
      <Header overlay />
      {/* Phase 20 — landing hero at the very top, then the broadcast banner (renders nothing when inactive), then the feed */}
      <Hero />
      {/* Phase 21d — unified red emergency strip (replaces the old separate
          broadcast banner + emergency cards): 4 equal columns */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 md:pt-10">
        <EmergencyStrip updates={updates} />
      </div>
      <main className="pt-4">
        <HomeFeed categories={categories} reports={reports} volunteers={volunteers} updates={updates} />
      </main>
      <BottomNav />
    </>
  );
}
