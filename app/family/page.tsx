import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { IconPin, IconUsers } from '@/components/icons';
import { getFamily } from '@/lib/store';
import { mockFamilyNote } from '@/lib/mock';

export const dynamic = 'force-dynamic';

export default async function FamilyPage() {
  const members = await getFamily();
  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6 lg:px-6">
        <h1 className="text-xl font-bold text-ink">পরিবার ট্র্যাকিং</h1>
        <p className="mt-1 text-sm text-ink-soft">আপনার প্রিয়জনরা এখন কোথায়</p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <IconUsers className="h-5 w-5" />
          </span>
          <p className="text-sm font-semibold text-amber-800">{mockFamilyNote}</p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
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
                <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                  <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-red-600" />
                  লাইভ
                </span>
              ) : (
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
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
