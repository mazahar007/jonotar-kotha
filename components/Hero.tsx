import Link from 'next/link';
import { IconCheck, IconPin, IconHome, IconMap, IconBell, IconUser } from './icons';

const PILLS = ['বেনামী রিপোর্ট', 'লাইভ SOS', 'সম্পূর্ণ ফ্রি', 'রোড আপডেট'];

/** Orbit badges around the red circle — glass circles, emoji only (no assets). */
const ORBITS: { icon: string; pos: string; label: string }[] = [
  { icon: '🩸', pos: 'left-[6%] top-[10%]', label: 'রক্ত' },
  { icon: '🏥', pos: 'right-[5%] top-[26%]', label: 'হাসপাতাল' },
  { icon: '🔥', pos: 'left-[3%] bottom-[22%]', label: 'জরুরি' },
  { icon: '👥', pos: 'right-[9%] bottom-[8%]', label: 'কমিউনিটি' },
];

/**
 * Phase 21c — hero right-side visual parity with the sample:
 * big red/coral circle backdrop + pure-CSS phone mockup showing a mini
 * জনতার কথা app UI (static), two floating glass cards (honest labels only),
 * 4 orbiting glass icon badges. No photos, no invented stats.
 * Theme-aware via CSS vars (dark lightweight + light).
 */
export default function Hero() {
  return (
    <section className="noise relative flex min-h-screen items-center overflow-hidden bg-[var(--bg)]">
      {/* gradient orbs — softened so edges dissolve invisibly into the page bg */}
      <div aria-hidden className="animate-pulse-slow pointer-events-none absolute -left-[10%] -top-[20%] h-[600px] w-[600px] rounded-full bg-brand/10 blur-[140px]" />
      <div
        aria-hidden
        className="animate-pulse-slow pointer-events-none absolute -bottom-[20%] -right-[10%] h-[500px] w-[500px] rounded-full bg-brand-dark/10 blur-[140px]"
        style={{ animationDelay: '2s' }}
      />
      <div
        aria-hidden
        className="animate-pulse-slow pointer-events-none absolute left-[50%] top-[40%] h-[300px] w-[300px] rounded-full bg-teal-glow/10 blur-[120px]"
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

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-28 md:pb-28 md:pt-36 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-6">
          {/* ============ LEFT: content ============ */}
          <div>
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

            {/* display headline — Phase 21d: 3 lines per user annotation */}
            <h1 className="mt-6 text-5xl font-bold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl">
              <span className="block text-ink">জনতার কথা</span>
              <span className="text-gradient block">আপনার এলাকার</span>
              <span className="text-gradient block">ডিজিটাল প্ল্যাটফর্ম</span>
            </h1>

            {/* subtext */}
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ink-soft">
              সমস্যা জানান, রোডের অবস্থা দেখুন, জরুরি SOS — সব এক অ্যাপে। গ্রাম
              থেকে শহর, আমরা আছি সবখানে।
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

            {/* CTAs — upgraded: larger + stronger glow */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/report"
                style={{ boxShadow: '0 18px 45px -10px rgba(99,102,241,0.75), 0 8px 24px -8px rgba(99,102,241,0.55)' }}
                className="btn-gradient group relative inline-flex min-h-14 items-center gap-x-2 rounded-2xl px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                📝 রিপোর্ট করুন
              </Link>
              {/* Phase 21d: solid RED SOS per user annotation (both themes) —
                  user 2026-10-22: lighter red + softer glow */}
              <Link
                href="/sos"
                style={{ boxShadow: '0 14px 34px -12px rgba(239,68,68,0.35), 0 6px 18px -8px rgba(239,68,68,0.22)' }}
                className="group inline-flex min-h-14 items-center gap-x-2 rounded-2xl bg-red-500 px-8 py-4 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-red-400"
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
                <span className="font-semibold text-ink">ময়মনসিংহ সদর</span> ·
                ১২টি ইউনিয়ন কভারেজ
              </p>
            </div>
          </div>

          {/* ============ RIGHT: phone composition (sample parity) ============ */}
          <div className="relative mx-auto flex min-h-[400px] w-full max-w-[340px] items-center justify-center sm:min-h-[480px] sm:max-w-[440px] lg:max-w-[520px]">
            {/* red/coral circle backdrop — lightened per user feedback */}
            <div
              aria-hidden
              className="absolute h-[280px] w-[280px] rounded-full bg-gradient-to-br from-[#fca5a5] to-[#ef4444] sm:h-[360px] sm:w-[360px] lg:h-[400px] lg:w-[400px]"
            />
            {/* soft red glow under circle — reduced */}
            <div
              aria-hidden
              className="absolute h-[280px] w-[280px] rounded-full bg-[#ef4444]/15 blur-[70px] sm:h-[360px] sm:w-[360px] lg:h-[400px] lg:w-[400px]"
            />
            {/* decorative rings */}
            <div
              aria-hidden
              className="absolute h-[330px] w-[330px] rounded-full border border-line opacity-70 sm:h-[420px] sm:w-[420px] lg:h-[470px] lg:w-[470px]"
            />
            <div
              aria-hidden
              className="absolute h-[330px] w-[330px] rounded-full border border-dashed border-line opacity-40 sm:h-[420px] sm:w-[420px] lg:h-[470px] lg:w-[470px]"
            />

            {/* CSS phone mockup */}
            <div className="animate-float relative z-10">
              <div className="relative w-[208px] rounded-[2.6rem] bg-[#0b1120] p-[7px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] sm:w-[236px]">
                {/* screen */}
                <div className="relative overflow-hidden rounded-[2.15rem] bg-[var(--surface)]">
                  {/* dynamic island */}
                  <div aria-hidden className="absolute left-1/2 top-2.5 z-20 h-[16px] w-[72px] -translate-x-1/2 rounded-full bg-black" />
                  {/* status bar */}
                  <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-medium text-ink-soft">
                    <span>৯:৪১</span>
                    <span className="flex items-center gap-1" aria-hidden>
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/60" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/60" />
                      <span className="h-1.5 w-1.5 rounded-full bg-ink-soft/30" />
                    </span>
                  </div>
                  {/* mini app header */}
                  <div className="flex items-center gap-1.5 px-4 pt-2.5">
                    <span className="btn-gradient flex h-6 w-6 items-center justify-center rounded-lg text-[11px]">
                      📢
                    </span>
                    <span className="text-[12px] font-bold text-ink">জনতার কথা</span>
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      লাইভ
                    </span>
                  </div>
                  {/* sample report card */}
                  <div className="card-glass mx-3 mt-3 !rounded-2xl p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-[15px]">
                        💡
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-bold text-ink">
                          রাস্তার বাতি নষ্ট
                        </p>
                        <p className="truncate text-[9px] text-ink-soft">
                          গাঙ্গিনাপাড় · ২ ঘণ্টা আগে
                        </p>
                      </div>
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2 py-0.5 text-[9px] font-semibold text-teal-glow">
                      <IconCheck className="h-2.5 w-2.5" />
                      যাচাইকৃত
                    </span>
                  </div>
                  {/* SOS button */}
                  <div className="mx-3 mt-3">
                    <div className="btn-danger flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-[12px] font-bold">
                      🆘 জরুরি SOS
                    </div>
                  </div>
                  {/* bottom nav */}
                  <div className="mt-3 flex items-center justify-around border-t border-line px-6 py-2.5">
                    <IconHome className="h-4 w-4 text-[#3b82f6]" />
                    <IconMap className="h-4 w-4 text-ink-soft" />
                    <IconBell className="h-4 w-4 text-ink-soft" />
                    <IconUser className="h-4 w-4 text-ink-soft" />
                  </div>
                </div>
              </div>
            </div>

            {/* floating glass card 1 — top-left */}
            <div className="glass absolute left-0 top-6 z-20 rounded-2xl px-3.5 py-2.5 shadow-xl sm:top-10">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/15">
                  <IconCheck className="h-4 w-4 text-teal-500" />
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink">যাচাইকৃত</span>
                  <span className="block text-[10px] text-ink-soft">রিপোর্ট সিস্টেম</span>
                </span>
              </div>
            </div>

            {/* floating glass card 2 — bottom-right */}
            <div className="glass absolute bottom-8 right-0 z-20 rounded-2xl px-3.5 py-2.5 shadow-xl sm:bottom-12">
              <div className="flex items-center gap-2">
                <span className="btn-danger flex h-8 w-8 items-center justify-center rounded-xl text-sm">
                  🆘
                </span>
                <span>
                  <span className="block text-xs font-bold text-ink">SOS</span>
                  <span className="block text-[10px] text-ink-soft">২৪/৭ সক্রিয়</span>
                </span>
              </div>
            </div>

            {/* orbiting icon badges */}
            {ORBITS.map((b) => (
              <span
                key={b.label}
                title={b.label}
                aria-label={b.label}
                className={`glass absolute z-20 flex h-11 w-11 items-center justify-center rounded-full text-lg shadow-lg ${b.pos}`}
              >
                {b.icon}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* bottom fade into page bg — tall for a seamless section blend */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent" />
    </section>
  );
}
