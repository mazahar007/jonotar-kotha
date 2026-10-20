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
    <nav className="sticky bottom-0 z-40 border-t border-[#efe3d3] bg-white/95 backdrop-blur">
      <div className="relative mx-auto flex max-w-md items-end justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1">
        {tabs.slice(0, 2).map(({ href, label, Icon }) => (
          <Tab key={href} href={href} label={label} Icon={Icon} active={pathname === href} />
        ))}
        {/* Center SOS action */}
        <Link
          href="/sos"
          aria-label="জরুরি SOS"
          className="sos-pulse -mt-9 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white"
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
      className={`flex w-16 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-semibold ${
        active ? 'text-brand' : 'text-ink-soft'
      }`}
    >
      <Icon className="h-6 w-6" />
      {label}
    </Link>
  );
}
