'use client';

import type { Report, Volunteer } from '@/lib/types';
import type { EmergencyNumber } from '@/lib/settings';
import CommunityBoards from './CommunityBoards';
import EmergencyBanner from './EmergencyBanner';
import HomeMemberSections from './HomeMemberSections';
import HomeSection from './HomeSection';
import HomeStatsStrip from './HomeStatsStrip';
import RoadsExplorer from './RoadsExplorer';
import SafetyScoreSection from './SafetyScoreSection';
import SampleSectionHead from './SampleSectionHead';
import SiteFooter from './SiteFooter';

/**
 * Everything below the reports section, in the zilaseba-redesign
 * reference's look. Phase 23 — one screen per section on desktop:
 * সেফটি → রোড → কমিউনিটি (heading + stats | tabbed leaderboard) →
 * red emergency banner + footer sharing the last screen.
 */
export default function HomeFeed({
  reports,
  volunteers,
  siteName,
  emergencyNumbers,
}: {
  reports: Report[];
  volunteers: Volunteer[];
  siteName: string;
  emergencyNumbers: EmergencyNumber[];
}) {
  return (
    <>
      <HomeSection orb="mid-left" tone="brand">
        <SafetyScoreSection />
      </HomeSection>

      <HomeSection orb="bottom-right" tone="violet">
        <RoadsExplorer variant="home" />
      </HomeSection>

      <HomeSection orb="top-right" tone="violet">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SampleSectionHead
              badge="কমিউনিটি"
              color="amber"
              title="এলাকার জন্য যারা"
              gradient="এগিয়ে আসছেন"
              subtext="রিপোর্ট, যাচাই আর সাহায্যে সবচেয়ে সক্রিয় মানুষেরা — আর তাদের কাজের ফলাফল।"
              size="page"
              stacked
            />
            <div className="mt-10">
              <HomeStatsStrip reports={reports} volunteers={volunteers} grid />
            </div>
            {/* Phase 3 — amar-elaka card (members only; renders nothing otherwise) */}
            <div className="mt-6 empty:hidden">
              <HomeMemberSections />
            </div>
          </div>
          <CommunityBoards volunteers={volunteers} />
        </div>
      </HomeSection>

      {/* Last screen: emergency banner centred in the space above the footer */}
      <div className="section-fullbleed lg:flex lg:min-h-svh lg:flex-col">
        <HomeSection orb={null} className="pb-16 pt-4 sm:pb-20 lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:py-24">
          <EmergencyBanner numbers={emergencyNumbers} />
        </HomeSection>
        <SiteFooter siteName={siteName} numbers={emergencyNumbers} />
      </div>
    </>
  );
}
