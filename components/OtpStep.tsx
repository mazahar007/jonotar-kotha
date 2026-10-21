'use client';

import { useEffect, useRef, useState } from 'react';
import { verifyOtpCode, type MemberSelfPayload, type OtpPurpose, type OtpSendResponse } from '@/lib/member';

const EXPIRE_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_S = 60;

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

interface Props {
  destination: string;
  channel: 'sms' | 'email';
  purpose: OtpPurpose;
  initialDemo: boolean;
  initialDemoCode?: string;
  /** Called when the code verifies. */
  onVerified: (member: MemberSelfPayload) => void;
  /** Re-send a fresh code (parent calls the right API). */
  onResend: () => Promise<OtpSendResponse>;
  onCancel?: () => void;
}

/**
 * Phase 13 — step 2 of OTP auth: 6-box code input, 5-min timer,
 * 60s resend cooldown, and an honest demo banner when no SMS/SMTP
 * provider is configured (never claims a real SMS was sent).
 */
export default function OtpStep({
  destination,
  channel,
  purpose,
  initialDemo,
  initialDemoCode,
  onVerified,
  onResend,
  onCancel,
}: Props) {
  const [boxes, setBoxes] = useState<string[]>(['', '', '', '', '', '']);
  const [left, setLeft] = useState(EXPIRE_MS / 1000);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(initialDemo);
  const [demoCode, setDemoCode] = useState(initialDemoCode || '');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const t = setInterval(() => {
      setLeft((v) => (v > 0 ? v - 1 : 0));
      setCooldown((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function setBox(i: number, v: string) {
    const d = v.replace(/\D/g, '').slice(-1);
    setBoxes((prev) => {
      const next = [...prev];
      next[i] = d;
      return next;
    });
    if (d && i < 5) inputs.current[i + 1]?.focus();
  }

  function onKey(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !boxes[i] && i > 0) inputs.current[i - 1]?.focus();
  }

  async function submit() {
    const code = boxes.join('');
    if (code.length !== 6) return setError('৬ সংখ্যার কোড দিন');
    setError('');
    setBusy(true);
    try {
      const member = await verifyOtpCode({ destination, code, purpose });
      onVerified(member);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'যাচাই করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (cooldown > 0 || resending) return;
    setError('');
    setResending(true);
    try {
      const r = await onResend();
      setDemo(r.demo);
      setDemoCode(r.demo_code || '');
      setBoxes(['', '', '', '', '', '']);
      setLeft(EXPIRE_MS / 1000);
      setCooldown(RESEND_COOLDOWN_S);
      inputs.current[0]?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'কোড পাঠানো যায়নি');
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-soft">
        {channel === 'sms' ? 'মোবাইল নম্বরে' : 'ইমেইলে'} পাঠানো ৬ সংখ্যার কোডটি দিন
      </p>
      <p className="mt-1 text-sm font-bold text-ink" dir="ltr">
        {destination}
      </p>

      {demo && demoCode && (
        <p className="mt-3 rounded-xl bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-300">
          ডেমো মোড: কোড <span dir="ltr" className="tracking-[0.3em]">{demoCode}</span>{' '}
          <span className="font-normal">(বাস্তব SMS-এর জন্য গেটওয়ে লাগবে)</span>
        </p>
      )}

      <div className="mt-4 flex justify-between gap-2" dir="ltr">
        {boxes.map((b, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            value={b}
            onChange={(e) => setBox(i, e.target.value)}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`কোডের ${i + 1} নম্বর সংখ্যা`}
            className="h-14 w-full min-w-0 rounded-xl border border-white/10 bg-cream text-center text-xl font-bold text-ink outline-none focus:border-brand"
          />
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className={left <= 60 ? 'font-bold text-brand' : 'text-ink-soft'}>
          {left > 0 ? `মেয়াদ: ${fmt(left)}` : 'কোডের মেয়াদ শেষ — আবার পাঠান'}
        </span>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || resending}
          className="min-h-[44px] rounded-xl px-3 font-bold text-brand disabled:text-ink-soft"
        >
          {resending ? 'পাঠানো হচ্ছে...' : cooldown > 0 ? `আবার পাঠান (${cooldown}সে)` : 'আবার পাঠান'}
        </button>
      </div>

      {error && <p className="mt-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

      <button
        onClick={submit}
        disabled={busy || left <= 0}
        className="mt-3 min-h-[52px] w-full rounded-2xl btn-gradient py-4 font-bold text-white disabled:opacity-50"
      >
        {busy ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
      </button>

      {onCancel && (
        <button onClick={onCancel} className="mt-2 min-h-[44px] w-full rounded-2xl bg-cream-dark py-3 text-sm font-bold text-ink">
          ফিরে যান
        </button>
      )}
    </div>
  );
}
