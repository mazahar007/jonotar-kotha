import Link from 'next/link';
import type { ReactNode } from 'react';
import { IconChevronRight } from './icons';

/**
 * Shared section header: icon in a colored rounded tile + BIG title +
 * one-line purpose subtitle (+ optional right-side action). Used for
 * every home section and page-top headers so each section's purpose is
 * instantly clear and the visual rhythm stays identical everywhere.
 */
export default function SectionHeader({
  icon,
  tileClassName = 'bg-cream-dark text-ink',
  title,
  subtitle,
  action,
  dark = false,
  as = 'h2',
  className = '',
  gradient = false,
}: {
  icon: ReactNode;
  tileClassName?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  dark?: boolean;
  as?: 'h1' | 'h2';
  className?: string;
  /** Phase 19 — signature blue→violet→teal gradient title (page-level headings) */
  gradient?: boolean;
}) {
  const Title = as;
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tileClassName}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <Title
          className={`text-[22px] font-bold leading-snug lg:text-2xl ${
            gradient ? 'text-gradient' : dark ? 'text-white' : 'text-ink'
          }`}
        >
          {title}
        </Title>
        {subtitle ? (
          <p className={`mt-0.5 text-sm leading-snug ${dark ? 'text-white/70' : 'text-ink-soft'}`}>
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** "সব দেখুন →" style action link for a SectionHeader's right side. */
export function SectionActionLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-11 shrink-0 items-center gap-0.5 text-sm font-bold text-brand"
    >
      {children}
      <IconChevronRight className="h-4 w-4" />
    </Link>
  );
}
