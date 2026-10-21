import Link from 'next/link';
import { IconMegaphone, IconPin } from './icons';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

/** Desktop nav links (sample-style pill nav). */
const NAV_LINKS = [
  { label: 'হোম', href: '/' },
  { label: 'রিপোর্ট', href: '/reports' },
  { label: 'রোড', href: '/roads' },
  { label: 'SOS', href: '/sos' },
];

/**
 * Phase 21 — floating glass header pill in the sample's style:
 * rounded-2xl glass pill, gradient logo tile, desktop nav links,
 * নীরব status chip, theme toggle (sun/moon), notification bell,
 * desktop "রিপোর্ট করুন" CTA.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 lg:px-6">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/10">
        {/* logo + title */}
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="btn-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <IconMegaphone className="h-5 w-5 text-white" />
          </span>
          <span className="min-w-0">
            <span className="text-gradient block truncate text-lg font-bold leading-tight">
              জনতার কথা
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <IconPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">ময়মনসিংহ · গাঙ্গিনাপাড়</span>
            </span>
          </span>
        </Link>

        {/* desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-overlay hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* right cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="chip-violet hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:flex">
            <span className="blink-dot inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
            নীরব
          </span>
          <ThemeToggle />
          <NotificationBell />
          <Link
            href="/report"
            className="btn-gradient hidden min-h-11 items-center rounded-xl px-5 text-sm font-semibold text-white md:inline-flex"
          >
            রিপোর্ট করুন
          </Link>
        </div>
      </nav>
    </header>
  );
}
