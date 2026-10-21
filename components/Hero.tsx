import Link from 'next/link';
import { IconCheck, IconPin } from './icons';

const PILLS = ['বেনামী রিপোর্ট', 'লাইভ SOS', 'সম্পূর্ণ ফ্রি', 'রোড আপডেট'];

/**
 * Phase 21 — hero rebuilt on the sample's REAL composition:
 * gradient orbs + grid pattern + noise, live badge w/ ping dot,
 * display headline (ink line 1 + gradient line 2), feature pills,
 * gradient rounded-2xl CTA + ghost secondary, honest coverage row.
 * Single column (no fake imagery/stats). Theme-aware via CSS vars.
 */
export default function Hero() {
  return (
    <section className="noise relative overflow-hidden">
      {/* gradient orbs */}
      <div aria-hidden className="animate-pulse-slow pointer-events-none absolute -left-[10%] -top-[20%] h-[600px] w-[600px] rounded-full bg-brand/15 blur-[120px]" />
      <div
        aria-hidden
        className="animate-pulse-slow pointer-events-none absolute -bottom-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-brand-dark/10 blur-[120px]"
        style={{ animationDelay: '2s' }}
      />
      <div
        aria-hidden
        className="animate-pulse-slow pointer-events-none absolute left-[50%] top-[40%] h-[300px] w-[300px] rounded-full bg-teal-glow/10 blur-[100px]"
        style={{ animationDelay: '4s' }}
      />

      {/* grid pattern */}
      <div aria-hidden className="pointer-events-none absolute inset-0 text-ink opacity-[0.05]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="jk-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#jk-grid)" />
        </svg>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-10 pt-8 md:pb-14 md:pt-12 lg:px-8">
        {/* live badge */}
        <span className="inline-flex items-center gap-x-3 rounded-full bg-overlay px-4 py-2 text-sm ring-1 ring-line">
          <span className="flex items-center gap-x-1.5 font-semibold text-emerald-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            লাইভ
          </span>
          <span aria-hidden className="h-3 w-px bg-line" />
          <span className="text-ink-soft">সেবা চালু আছে আপনার এলাকায়</span>
        </span>

        {/* display headline */}
        <h1 className="mt-6 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block text-ink">জনতার কথা</span>
          <span className="text-gradient block">আপনার এলাকার ডিজিটাল প্ল্যাটফর্ম</span>
        </h1>

        {/* subtext */}
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
          সমস্যা জানান, রোডের অবস্থা দেখুন, জরুরি SOS — সব এক অ্যাপে। গ্রাম থেকে
          শহর, আমরা আছি সবখানে।
        </p>

        {/* feature pills */}
        <div className="mt-8 flex flex-wrap gap-3">
          {PILLS.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-x-1.5 rounded-full bg-overlay px-3.5 py-1.5 text-xs font-medium text-ink ring-1 ring-line"
            >
              <svg className="h-3 w-3 text-teal-glow" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              {tag}
            </span>
          ))}
        </div>

        {/* CTAs — sample-style rounded-2xl */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/report"
            className="btn-gradient group relative inline-flex min-h-14 items-center gap-x-2 rounded-2xl px-7 text-base font-semibold text-white shadow-xl shadow-brand/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            📝 রিপোর্ট করুন
          </Link>
          <Link
            href="/sos"
            className="btn-ghost group inline-flex min-h-14 items-center gap-x-2 rounded-2xl px-7 text-base font-semibold"
          >
            🆘 জরুরি SOS
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* honest coverage row — real data only, no invented stats */}
        <div className="mt-10 flex items-center gap-x-3 text-sm text-ink-soft">
          <span className="btn-gradient flex h-9 w-9 items-center justify-center rounded-xl">
            <IconPin className="h-4 w-4 text-white" />
          </span>
          <p>
            <span className="font-semibold text-ink">ময়মনসিংহ সদর</span> · ১২টি ইউনিয়ন
            কভারেজ
          </p>
        </div>
      </div>

      {/* bottom fade into page bg */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg)] to-transparent" />
    </section>
  );
}
