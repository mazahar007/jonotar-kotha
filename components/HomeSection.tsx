import type { ReactNode } from 'react';

/**
 * Full-bleed home section in the zilaseba-redesign reference's rhythm: one
 * soft blurred colour orb behind the content, content centred in max-w-7xl.
 *
 * Phase 23 — "screen" rhythm (user: "web এর ক্ষেত্রে প্রতি সেকশন যেন এক
 * পেজে থাকে উপরে নিচের গ্যাপ সহ"): on lg+ every section is exactly one
 * viewport tall with its content vertically centred and the same 96px
 * breathing room top and bottom (clears the floating header pill). Phones
 * keep a uniform py-16 stack.
 */
const ORB_POS = {
  'top-left': '-top-24 -left-24',
  'top-right': '-top-24 -right-24',
  'bottom-left': '-bottom-24 -left-24',
  'bottom-right': '-bottom-24 -right-24',
  'mid-left': 'top-1/2 -left-40 -translate-y-1/2',
} as const;

const ORB_TONE = {
  brand: 'bg-brand/10',
  violet: 'bg-brand-dark/10',
  teal: 'bg-teal-glow/10',
  red: 'bg-red-glow/10',
} as const;

export const SCREEN_CLS = 'home-screen py-16 sm:py-20 lg:flex lg:min-h-svh lg:flex-col lg:justify-center lg:py-24';

export default function HomeSection({
  children,
  id,
  orb = 'top-right',
  tone = 'violet',
  className = SCREEN_CLS,
}: {
  children: ReactNode;
  id?: string;
  /** null = no orb. */
  orb?: keyof typeof ORB_POS | null;
  tone?: keyof typeof ORB_TONE;
  className?: string;
}) {
  return (
    <section id={id} className={`section-fullbleed relative overflow-hidden ${className}`}>
      {orb && (
        <div
          aria-hidden
          className={`pointer-events-none absolute h-[420px] w-[420px] rounded-full blur-[120px] ${ORB_POS[orb]} ${ORB_TONE[tone]}`}
        />
      )}
      <div className="relative mx-auto w-full max-w-7xl px-4">{children}</div>
    </section>
  );
}
