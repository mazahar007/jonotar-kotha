import Link from 'next/link';
import { IconWifi } from '@/components/icons';

/**
 * Phase 12 — PWA offline fallback page.
 * Shown by the service worker when navigation fails and the device is offline.
 */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-cream px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f7ecdd] text-[#cc1414]">
        <IconWifi className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-ink">ইন্টারনেট নেই</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        আপনার ডিভাইস অফলাইনে আছে — কিছু তথ্য ক্যাশ থেকে দেখানো হচ্ছে।
        সংযোগ ফিরলে পেজটি আবার লোড করুন।
      </p>
      <Link
        href="/"
        className="mt-6 flex min-h-11 items-center justify-center rounded-2xl bg-[#cc1414] px-6 text-sm font-bold text-white"
      >
        আবার চেষ্টা করুন
      </Link>
    </main>
  );
}
