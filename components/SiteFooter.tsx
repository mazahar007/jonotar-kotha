import Link from 'next/link';
import type { EmergencyNumber } from '@/lib/settings';
import { bnNum } from '@/lib/time';
import { IconMegaphone, IconPhone } from './icons';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'সেবাসমূহ',
    links: [
      { label: 'রিপোর্ট করুন', href: '/report' },
      { label: 'সব রিপোর্ট', href: '/reports' },
      { label: 'রোড ও মোড়ের অবস্থা', href: '/roads' },
      { label: 'রক্তদাতা খুঁজুন', href: '/blood' },
    ],
  },
  {
    title: 'নিরাপত্তা',
    links: [
      { label: 'জরুরি SOS', href: '/sos' },
      { label: 'জরুরি ঘোষণা', href: '/broadcasts' },
      { label: 'ভ্রমণ মোড', href: '/travel' },
      { label: 'প্রমাণ লকার', href: '/locker' },
    ],
  },
  {
    title: 'সদস্য',
    links: [
      { label: 'প্রোফাইল', href: '/profile' },
      { label: 'নিবন্ধন করুন', href: '/register' },
      { label: 'এলাকার জরিপ', href: '/surveys' },
      { label: 'আমার এলাকার মানুষ', href: '/amar-elaka' },
    ],
  },
];

/**
 * Phase 22 — site footer in the zilaseba reference's layout: brand block
 * (logo, blurb, quick-call chips in place of social icons) + three link
 * columns, then a hairline bottom bar.
 */
export default function SiteFooter({ siteName, numbers }: { siteName: string; numbers: EmergencyNumber[] }) {
  const year = bnNum(new Date().getFullYear());
  return (
    <footer className="section-fullbleed relative border-t border-line" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        ফুটার
      </h2>
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:pt-20">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-x-2.5">
              <span className="btn-gradient flex h-9 w-9 items-center justify-center rounded-xl">
                <IconMegaphone className="h-[18px] w-[18px] text-white" />
              </span>
              <span className="text-xl font-bold text-ink">{siteName}</span>
            </Link>
            <p className="max-w-xs text-sm leading-7 text-ink-soft">
              ময়মনসিংহের নাগরিক নিরাপত্তা ও সমস্যা রিপোর্টিং প্ল্যাটফর্ম। সমস্যা জানান, রোডের অবস্থা দেখুন,
              জরুরি মুহূর্তে SOS — সব এক জায়গায়।
            </p>
            <div className="flex flex-wrap gap-2">
              {numbers.slice(0, 3).map((n) => (
                <a
                  key={n.number}
                  href={`tel:${n.number}`}
                  title={n.name}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-overlay px-3 text-xs font-semibold text-ink-soft transition-all duration-300 hover:bg-overlay-strong hover:text-ink"
                >
                  <IconPhone className="h-3.5 w-3.5" />
                  {bnNum(n.number)}
                </a>
              ))}
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-3 xl:col-span-2 xl:mt-0">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-semibold tracking-wider text-ink">{col.title}</h3>
                <ul role="list" className="mt-6 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-sm text-ink-soft transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-14 flex flex-col items-center gap-3 border-t border-line pt-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-xs text-ink-soft">
            © {year} {siteName} — ময়মনসিংহ। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-xs text-ink-soft">
            জরুরি প্রয়োজনে <a href="tel:999" className="font-semibold text-ink hover:text-red-400">৯৯৯</a> নম্বরে কল করুন
          </p>
        </div>
      </div>
    </footer>
  );
}
