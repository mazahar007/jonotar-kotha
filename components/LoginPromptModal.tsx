'use client';

import Link from 'next/link';

/**
 * Phase 14 — friendly login prompt shown when a logged-out member taps a
 * post action (one-tap presets, road update form). Points to /register,
 * which also hosts login + OTP verification (Phase 13).
 * Phase 17 — `returnTo`: after login/verification the member lands directly
 * on the submit page (with any prefill query params preserved).
 */
export default function LoginPromptModal({
  open,
  onClose,
  message,
  returnTo = '/roads/submit',
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
  returnTo?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="লগিন প্রয়োজন"
    >
      <button type="button" aria-label="বন্ধ করুন" onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-sm rounded-t-3xl border border-line-strong bg-surface p-6 pb-8 text-center shadow-2xl sm:rounded-3xl">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-cream text-2xl" aria-hidden>
          🔐
        </div>
        <h2 className="text-lg font-bold text-ink">পোস্ট করতে লগিন করুন</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          {message ?? 'রোডের অবস্থা জানাতে প্রথমে লগিন বা রেজিস্ট্রেশন করুন — এক মিনিটেই হয়ে যাবে।'}
        </p>
        <Link
          href={`/register?returnTo=${encodeURIComponent(returnTo)}`}
          className="mt-5 flex min-h-12 items-center justify-center rounded-2xl btn-gradient px-4 font-bold text-white transition active:scale-[0.98]"
        >
          লগিন / রেজিস্টার করুন
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 min-h-11 w-full rounded-2xl px-4 font-bold text-ink-soft transition active:scale-[0.98]"
        >
          পরে
        </button>
      </div>
    </div>
  );
}
