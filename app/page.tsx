import BottomNav from '@/components/BottomNav';
import EmergencyStrip from '@/components/EmergencyStrip';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import HomeFeed from '@/components/HomeFeed';
import HomeReportsSection from '@/components/HomeReportsSection';
import HomeSection from '@/components/HomeSection';
import { HomeSurveySection } from '@/components/HomeMemberSections';
import { getCategories, getMunicipalityUpdates, getReports, getVolunteers } from '@/lib/store';
import { DEFAULT_SETTINGS, getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [categories, reports, volunteers, updates, settings] = await Promise.all([
    getCategories(),
    getReports(),
    getVolunteers(),
    getMunicipalityUpdates(),
    getSettings(),
  ]);
  return (
    <>
      {/* Phase 21d — overlay header: fixed pill floating over the hero,
          whose background spans the full viewport from the top edge. */}
      <Header overlay />
      {/* Phase 20 — landing hero at the very top, then the broadcast banner (renders nothing when inactive), then the feed */}
      <Hero settings={settings} />
      {/* Phase 21d — unified red emergency strip (replaces the old separate
          broadcast banner + emergency cards): 4 equal columns */}
      <div className="mx-auto w-full max-w-7xl px-4 py-2.5">
        <EmergencyStrip updates={updates} />
      </div>
      {/* From here down every section is one screen on desktop (Phase 23,
          HomeSection SCREEN_CLS): জরিপ → রিপোর্ট → সেফটি → রোড →
          কমিউনিটি → জরুরি ব্যানার + ফুটার. */}
      <HomeSection orb="top-left" tone="brand">
        <HomeSurveySection />
      </HomeSection>
      <HomeSection orb="mid-left" tone="violet">
        <HomeReportsSection categories={categories} reports={reports} />
      </HomeSection>
      <HomeFeed
        reports={reports}
        volunteers={volunteers}
        siteName={settings.site_name}
        emergencyNumbers={settings.emergency_numbers.length > 0 ? settings.emergency_numbers : DEFAULT_SETTINGS.emergency_numbers}
      />
      <BottomNav />
    </>
  );
}
