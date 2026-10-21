import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import SectionHeader from '@/components/SectionHeader';
import { IconPin, IconUsers } from '@/components/icons';
import { getFamily } from '@/lib/store';
import { mockFamilyNote } from '@/lib/mock';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  const members = await getFamily();
  return (
    <>
      <main className="mx-auto w-full max-w-7xl min-h-dvh bg-cream px-4 pb-10 pt-4">
        <SectionHeader
          gradient
          as="h1"
          icon={<IconUsers className="h-6 w-6" />}
          tileClassName="bg-amber-500/15 text-amber-300"
          title="পরিবার ট্র্যাকিং"
          subtitle="আপনার প্রিয়জনরা এখন কোথায়"
        />

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-500/10 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-300">
            <IconUsers className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-amber-300">{mockFamilyNote}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl bg-surface border border-white/10 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-dark text-lg font-bold text-ink">
                {m.name.charAt(0)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">
                  {m.name}
                  <span className="ml-2 text-xs font-normal text-ink-soft">{m.relation}</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-ink-soft">
                  <IconPin className="h-3.5 w-3.5" />
                  {m.status} · {m.location_name}
                </p>
              </div>
              {m.is_live ? (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-300">
                  <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
                  লাইভ
                </span>
              ) : (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-ink-soft">
                  {m.status}
                </span>
              )}
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
