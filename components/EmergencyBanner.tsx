import Link from 'next/link';
import type { EmergencyNumber } from '@/lib/settings';
import { bnNum } from '@/lib/time';
import { IconPhone } from './icons';

/**
 * Phase 22 — red call-to-action banner in the zilaseba reference's style
 * ("জরুরি রক্তের প্রয়োজন?"): red gradient + noise, pinging icon tile,
 * white primary button. Same in both themes.
 */
export default function EmergencyBanner({ numbers }: { numbers: EmergencyNumber[] }) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
      <div aria-hidden className="noise absolute inset-0" />
      <div className="relative px-6 py-10 sm:px-14 sm:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="relative shrink-0 self-start sm:self-auto">
              <span aria-hidden className="absolute inset-0 animate-ping rounded-2xl bg-white/15" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                <IconPhone className="h-7 w-7 text-white" />
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">জরুরি সাহায্য দরকার?</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-red-50/85">
                পুলিশ, ফায়ার সার্ভিস, অ্যাম্বুলেন্স — ২৪/৭ এক ট্যাপে কল করুন। বিপদে পড়লে SOS চাপুন, বিশ্বস্তরা সাথে সাথে জানবে।
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {numbers.map((n) => (
                  <a
                    key={n.number}
                    href={`tel:${n.number}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-xs font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/25"
                  >
                    {n.name}
                    <span className="font-bold">{bnNum(n.number)}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          <Link
            href="/sos"
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-x-2.5 rounded-2xl bg-white px-7 text-sm font-bold text-red-600 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            🆘 জরুরি SOS খুলুন
          </Link>
        </div>
      </div>
    </div>
  );
}
