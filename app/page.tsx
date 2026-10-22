import BottomNav from '@/components/BottomNav';
import EmergencyStrip from '@/components/EmergencyStrip';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HomeFeed from '@/components/HomeFeed';
import HomeReportsSection from '@/components/HomeReportsSection';
import { HomeSurveySection } from '@/components/HomeMemberSections';
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
      <div className="mx-auto w-full max-w-7xl px-4 pt-[10px] pb-[10px]">
        <EmergencyStrip updates={updates} />
      </div>
      {/* Phase 21x — survey as a standalone full-screen-width section
          (user: "এটা পুরো স্ক্রিন জুড়ে হবে। একটা সেকশন।")
          Phase 21ad — one full page per screen: min-h-screen + centered,
          subtext→box gap 30px (user: "এক পেজে শুধু এই সেকশন টা দেখা যাবে।
          সেভাবে px fixed করো... এই টেক্সটের পরে ৩০ px হবে বক্স টা থেকে") */}
      <div className="section-fullbleed flex min-h-screen items-center py-24 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-4">
          <HomeSurveySection />
        </div>
      </div>
      {/* Phase 21ag — reports as a standalone full-page section, same rhythm
          as the survey section (user: "এটার জন্য উপরের মত সেকশন করে দাও।
          পুরো এক পেজ জুড়ে হবে।") */}
      <div className="section-fullbleed flex min-h-screen items-center py-24 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-4">
          <HomeReportsSection categories={categories} reports={reports} />
        </div>
      </div>
      <main className="pt-4">
        <HomeFeed categories={categories} reports={reports} volunteers={volunteers} />
      </main>
      <BottomNav />
    </>
  );
}
