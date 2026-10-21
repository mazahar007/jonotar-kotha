'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCheck,
  IconDroplet,
  IconHome,
  IconLock,
  IconMap,
  IconMegaphone,
  IconPin,
  IconRoute,
  IconUser,
  IconUsers,
} from './icons';

const links = [
  { href: '/', label: 'হোম', Icon: IconHome },
  { href: '/map', label: 'ম্যাপ', Icon: IconMap },
  { href: '/blood', label: 'রক্তদাতা', Icon: IconDroplet },
  { href: '/travel', label: 'ভ্রমণ', Icon: IconMegaphone },
  { href: '/family', label: 'পরিবার', Icon: IconUsers },
  { href: '/surveys', label: 'জরিপ', Icon: IconCheck },
  { href: '/roads', label: 'রোডের অবস্থা', Icon: IconRoute },
  { href: '/amar-elaka', label: 'আমার এলাকার মানুষ', Icon: IconPin },
  { href: '/locker', label: 'প্রমাণ লকার', Icon: IconLock },
  { href: '/profile', label: 'প্রোফাইল', Icon: IconUser },
];

/** Desktop-only left navigation (lg+). Mobile keeps the bottom nav. */
export default function Sidebar() {
  const pathname = usePathname();
  // Admin & login have their own chrome — no public sidebar there.
  if (pathname.startsWith('/admin') || pathname.startsWith('/login')) return null;

  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-r border-line bg-cream px-5 py-6 lg:flex">
      <Link href="/" className="block">
        <span className="text-2xl font-bold leading-tight text-ink">জনতার কথা</span>
        <span className="mt-0.5 block text-[13px] text-ink-soft">নাগরিক নিরাপত্তা ও সমস্যা রিপোর্টিং</span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {links.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-base font-semibold transition ${
                active ? 'btn-gradient text-white' : 'text-ink-soft hover:bg-surface hover:text-ink'
              }`}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/sos"
        className="sos-pulse mt-auto flex items-center justify-center gap-2 rounded-2xl btn-danger py-4 text-lg font-bold text-white"
      >
        জরুরি SOS
      </Link>
      <p className="mt-3 text-center text-xs text-ink-soft">জাতীয় জরুরি সেবা · ৯৯৯</p>
    </aside>
  );
}
