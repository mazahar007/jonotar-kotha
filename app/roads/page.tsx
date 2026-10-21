import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import RoadsExplorer from '@/components/RoadsExplorer';
import SectionHeader from '@/components/SectionHeader';
import { IconChevronLeft, IconRoute } from '@/components/icons';
import type { RoadKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Phase 16 — honors ?kind=road | ?kind=spot (from the home sliders' See More
 * buttons): shows only that sub-group, in full grid form — everything still
 * browsable here.
 */
export default async function RoadsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  const kind: RoadKind | null = sp.kind === 'road' || sp.kind === 'spot' ? sp.kind : null;

  const title = kind === 'road' ? 'রোডসমূহ' : kind === 'spot' ? 'মোড় ও গুরুত্বপূর্ণ স্থান' : 'রোড ও মোড়ের অবস্থা';
  const subtitle =
    kind === 'road'
      ? 'সব রোডের লাইভ অবস্থা — নতুন আপডেট প্রথমে'
      : kind === 'spot'
        ? 'সব মোড় ও গুরুত্বপূর্ণ স্থানের লাইভ অবস্থা'
        : 'রাস্তা ও গুরুত্বপূর্ণ মোড়ের লাইভ অবস্থা';

  return (
    <>
      <Header />
      <main className="px-4 pb-6 pt-4 lg:px-6">
        {kind && (
          <Link
            href="/roads"
            className="mb-3 flex min-h-11 w-fit items-center gap-1 text-sm font-bold text-ink-soft"
          >
            <IconChevronLeft className="h-4 w-4" />
            সব রোড ও মোড়
          </Link>
        )}
        <SectionHeader
          as="h1"
          icon={<IconRoute className="h-6 w-6" />}
          tileClassName="bg-orange-100 text-orange-700"
          title={title}
          subtitle={subtitle}
        />
        <p className="mb-5 mt-3 text-sm text-ink-soft">
          এলাকাভিত্তিক রোড ও গুরুত্বপূর্ণ মোড়/স্থানের লাইভ অবস্থা — কোথায় জ্যাম, ঝামেলা, বিদ্যুৎ আছে কি নেই, আপডেট দেখুন ও এক ট্যাপে নিজে জানান।
        </p>
        <RoadsExplorer variant="full" initialKind={kind} />
      </main>
      <BottomNav />
    </>
  );
}
