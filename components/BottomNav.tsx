'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconDroplet, IconHome, IconMap, IconUser } from './icons';

const tabs = [
  { href: '/', label: 'হোম', Icon: IconHome },
  { href: '/map', label: 'ম্যাপ', Icon: IconMap },
  { href: '/blood', label: 'রক্ত', Icon: IconDroplet },
  { href: '/profile', label: 'প্রোফাইল', Icon: IconUser },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-40 border-t border-line bg-surface/90 backdrop-blur-xl lg:hidden">
      <div className="relative mx-auto flex max-w-md items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {tabs.slice(0, 2).map(({ href, label, Icon }) => (
          <Tab key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}
        {/* Center SOS action */}
        <Link
          href="/sos"
          aria-label="জরুরি SOS"
          className="sos-pulse -mt-9 flex h-16 w-16 flex-col items-center justify-center rounded-full btn-danger text-[11px] font-bold text-white"
        >
          <span className="text-lg font-bold leading-none">SOS</span>
        </Link>
        {tabs.slice(2).map(({ href, label, Icon }) => (
          <Tab key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}
      </div>
    </nav>
  );
}

function Tab({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: (p: { className?: string }) => React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`relative flex min-h-[56px] w-16 flex-col items-center justify-center gap-1 rounded-xl py-2 text-xs ${
        active ? 'font-bold text-brand' : 'font-semibold text-ink-soft'
      }`}
    >
      {active && (
        <span className="absolute inset-x-3 top-0 h-[3px] rounded-full bg-brand" aria-hidden />
      )}
      <Icon className="h-7 w-7" />
      {label}
    </Link>
  );
}
