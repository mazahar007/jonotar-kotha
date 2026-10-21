import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import SectionHeader from '@/components/SectionHeader';
import { IconChevronRight, IconMegaphone, IconPhone, IconPin, IconShield, IconStar } from '@/components/icons';
import { getGuides, getShelters } from '@/lib/store';

export const dynamic = 'force-dynamic';

export default async function TravelPage() {
  const [guides, shelters] = await Promise.all([getGuides(), getShelters()]);
  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6 lg:px-6">
        <SectionHeader
          gradient
          as="h1"
          icon={<IconMegaphone className="h-6 w-6" />}
          tileClassName="bg-sky-500/15 text-sky-300"
          title="ভ্রমণ মোড"
          subtitle="আশেপাশে বিশ্বস্ত গাইড ও নিরাপদ আশ্রয় দেখুন"
          action={
            <span className="mt-1.5 shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
              চালু
            </span>
          }
        />

        <h2 className="mb-3 mt-6 font-bold text-ink">যাচাইকৃত গাইড</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {guides.map((g) => (
            <div key={g.id} className="rounded-2xl bg-surface border border-white/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark text-lg font-bold text-ink">
                  {g.name.charAt(0)}
                </span>
                <div className="flex-1">
                  <p className="font-bold text-ink">{g.name}</p>
                  <p className="flex items-center gap-2 text-xs text-ink-soft">
                    <span className="flex items-center gap-0.5 font-bold text-amber-500">
                      <IconStar className="h-3.5 w-3.5" /> {Number(g.rating).toFixed(1)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <IconPin className="h-3.5 w-3.5" /> {g.distance_m}মি
                    </span>
                  </p>
                </div>
                {g.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    <IconShield className="h-3.5 w-3.5" /> ট্রিপ যাচাইকৃত
                  </span>
                )}
              </div>
              <a
                href="tel:01XXXXXXXXX"
                className="mt-3 flex items-center justify-center gap-2 rounded-xl btn-gradient py-2.5 text-sm font-bold text-white"
              >
                <IconPhone className="h-4 w-4" /> কল করুন
              </a>
            </div>
          ))}
        </div>

        <h2 className="mb-3 mt-6 font-bold text-ink">নিরাপদ আশ্রয়</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {shelters.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <IconShield className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">{s.name}</p>
                <p className="text-xs text-ink-soft">
                  {s.shelter_type} · {s.distance_m}মি
                </p>
              </div>
              <IconChevronRight className="h-5 w-5 text-ink-soft" />
            </div>
          ))}
        </div>

        <Link href="/" className="mt-6 block text-center text-sm font-bold text-brand">
          ← হোমে ফিরুন
        </Link>
      </main>
      <BottomNav />
    </>
  );
}
