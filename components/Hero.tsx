import Link from 'next/link';
import { IconCheck } from './icons';

const PILLS = ['বেনামী রিপোর্ট', 'লাইভ SOS', 'সম্পূর্ণ ফ্রি', 'রোড আপডেট'];

/**
 * Phase 20 — Zila Seba-style landing hero, left-aligned, at the very top of home:
 * live pill → huge display headline → muted subtext → 2×2 checkmark pills →
 * stacked rounded-full CTAs. Subtle radial glow behind (CSS only), compact on mobile.
 */
export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* subtle radial glow, CSS only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(720px 420px at 16% -4%, rgba(59,130,246,0.17), transparent 65%), radial-gradient(560px 380px at 88% 18%, rgba(139,92,246,0.13), transparent 65%)',
        }}
      />
      <div className="relative mx-auto w-full max-w-7xl px-4 pb-6 pt-8 md:pb-10 md:pt-12">
        {/* 1 — live pill: dark tinted, green dot + green bold "লাইভ" + divider + muted text */}
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="font-bold text-emerald-300">লাইভ</span>
          <span aria-hidden className="h-4 w-px bg-white/15" />
          <span className="text-ink-soft">আপনার এলাকায় সক্রিয়</span>
        </span>

        {/* 2 — display headline: solid white line 1, gradient line 2, tight leading */}
        <h1 className="mt-5 text-[42px] font-extrabold leading-[1.05] tracking-tight md:text-[64px]">
          <span className="block text-white">জনতার কথা</span>
          <span className="text-gradient block">আপনার এলাকার ডিজিটাল প্ল্যাটফর্ম</span>
        </h1>

        {/* 3 — muted subtext */}
        <p className="mt-4 max-w-xl text-base text-ink-soft md:text-lg">
          সমস্যা জানান, রোডের অবস্থা দেখুন, জরুরি SOS — সব এক অ্যাপে।
        </p>

        {/* 4 — checkmark pills: 2×2 grid on mobile */}
        <div className="mt-5 grid max-w-md grid-cols-2 gap-2.5">
          {PILLS.map((label) => (
            <span
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-ink"
            >
              <IconCheck className="h-4 w-4 shrink-0 text-teal-glow" />
              {label}
            </span>
          ))}
        </div>

        {/* 5 + 6 — stacked fully-rounded CTAs */}
        <div className="mt-6 flex max-w-md flex-col gap-3">
          <Link
            href="/report"
            className="btn-gradient inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-lg font-bold text-white"
          >
            📝 রিপোর্ট করুন
          </Link>
          <Link
            href="/sos"
            className="btn-ghost inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-lg font-bold"
          >
            🆘 জরুরি SOS <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
