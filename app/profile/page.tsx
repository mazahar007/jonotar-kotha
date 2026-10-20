import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import { IconChevronRight, IconLock, IconShield, IconUser, IconUsers } from '@/components/icons';

export default function ProfilePage() {
  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6">
        <div className="flex items-center gap-4 rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-dark text-2xl font-bold text-ink">
            <IconUser className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-ink">নাগরিক</h1>
            <p className="text-sm text-ink-soft">ময়মনসিংহ · গাঙ্গিনাপাড়</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <Link
            href="/login?next=/admin"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
              <IconUsers className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">নিবন্ধন</span>
              <span className="block text-xs text-ink-soft">স্বেচ্ছাসেবক হিসেবে যোগ দিন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          <Link href="/locker" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-200 text-ink">
              <IconLock className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">প্রমাণ লকার</span>
              <span className="block text-xs text-ink-soft">এনক্রিপ্টেড প্রমাণ দেখুন</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>

          <Link href="/family" className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <IconShield className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-ink">সাহায্য</span>
              <span className="block text-xs text-ink-soft">জরুরি হটলাইন: ৯৯৯ · ১০৯ · ৩৩৩</span>
            </span>
            <IconChevronRight className="h-5 w-5 text-ink-soft" />
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-ink-soft">জনতার কথা · ময়মনসিংহ</p>
      </main>
      <BottomNav />
    </>
  );
}
