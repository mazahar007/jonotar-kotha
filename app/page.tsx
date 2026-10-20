import BottomNav from '@/components/BottomNav';
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
      <main className="pt-4">
        <HomeFeed categories={categories} reports={reports} volunteers={volunteers} updates={updates} />
      </main>
      <BottomNav />
    </>
  );
}
