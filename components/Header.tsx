'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { IconMegaphone, IconPin, IconUser } from './icons';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

/** Primary desktop nav links (moved from the removed desktop sidebar). */
const NAV_LINKS = [
  { label: 'হোম', href: '/' },
  { label: 'রিপোর্ট', href: '/reports' },
  { label: 'রোড', href: '/roads' },
  { label: 'রক্তদাতা', href: '/blood' },
  { label: 'জরিপ', href: '/surveys' },
  { label: 'SOS', href: '/sos' },
];

/** Secondary links inside the ☰ মেনু dropdown (moved from the removed sidebar). */
const MENU_LINKS = [
  { label: 'ম্যাপ', href: '/map' },
  { label: 'ভ্রমণ', href: '/travel' },
  { label: 'পরিবার', href: '/family' },
  { label: 'আমার এলাকার মানুষ', href: '/amar-elaka' },
  { label: 'প্রমাণ লকার', href: '/locker' },
];

function ChevronDown({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

/**
 * Phase 21d — floating glass header pill, now the SOLE desktop nav
 * (the old left sidebar was removed; its links moved here).
 * Primary links inline + "☰ মেনু" dropdown for the rest.
 * `overlay` (home page): fixed position so the hero background spans
 * the full viewport from the very top edge behind the pill.
 */
export default function Header({ overlay = false }: { overlay?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={
        overlay
          ? 'fixed inset-x-0 top-0 z-50 px-3 pt-3 lg:px-6'
          : 'sticky top-0 z-40 px-3 pt-3 lg:px-6'
      }
    >
      <nav className="glass mx-auto flex max-w-7xl items-center justify-between gap-2 rounded-2xl px-4 py-2.5 shadow-lg shadow-black/10">
        {/* logo + title */}
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <span className="btn-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <IconMegaphone className="h-5 w-5 text-white" />
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="text-gradient block truncate text-lg font-bold leading-tight">
              জনতার কথা
            </span>
            <span className="flex items-center gap-1 text-xs text-ink-soft">
              <IconPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">ময়মনসিংহ · গাঙ্গিনাপাড়</span>
            </span>
          </span>
        </Link>

        {/* desktop nav (lg+): primary links + ☰ মেনু dropdown */}
        <div className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold transition ${
                  active
                    ? 'bg-brand/15 text-ink'
                    : 'text-ink-soft hover:bg-overlay hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* ☰ মেনু dropdown */}
          <div className="group relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-label="আরও মেনু"
              className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-semibold text-ink transition hover:bg-overlay"
            >
              <span aria-hidden>☰</span> মেনু
              <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute right-0 top-full z-50 pt-2 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <div role="menu" className="menu-dropdown w-60 rounded-2xl p-2 shadow-xl shadow-black/40">
                {MENU_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      role="menuitem"
                      href={link.href}
                      className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-brand/15 text-ink'
                          : 'text-ink-soft hover:bg-overlay hover:text-ink'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* right cluster */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* mobile hamburger menu (Phase 21u, user: "মেনু টা হেডারে এড করে দাও") */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="মেনু"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft transition hover:bg-overlay hover:text-ink"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            {menuOpen && (
              <div className="menu-dropdown absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl p-2 shadow-xl shadow-black/40">
                {[...NAV_LINKS, ...MENU_LINKS].map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                        active
                          ? 'bg-brand/15 text-ink'
                          : 'text-ink-soft hover:bg-overlay hover:text-ink'
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <Link
            href="/profile"
            aria-label="প্রোফাইল"
            className="chip-violet hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold sm:flex"
          >
            <IconUser className="h-3.5 w-3.5" />
            প্রোফাইল
          </Link>
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
