'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OtpStep from './OtpStep';
import { loginWithOtp, useMember, type OtpSendResponse } from '@/lib/member';

const inputCls =
  'w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand';

/** Shared Phase-13 OTP login box (used on /register and /profile). */
export default function MemberOtpLogin({ redirectTo = '/profile' }: { redirectTo?: string }) {
  const router = useRouter();
  const { setMember } = useMember();
  const [destination, setDestination] = useState('');
  const [sent, setSent] = useState<OtpSendResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setError('');
    if (!destination.trim()) return setError('মোবাইল নম্বর অথবা ইমেইল দিন');
    setBusy(true);
    try {
      setSent(await loginWithOtp(destination.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'কোড পাঠানো যায়নি');
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <OtpStep
        destination={sent.destination}
        channel={sent.channel}
        purpose="login"
        initialDemo={sent.demo}
        initialDemoCode={sent.demo_code}
        onResend={() => loginWithOtp(sent.destination)}
        onCancel={() => setSent(null)}
        onVerified={(m) => {
          setMember(m);
          router.push(redirectTo);
        }}
      />
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="01XXXXXXXXX / you@example.com"
          inputMode="email"
          className={inputCls}
        />
        <button
          onClick={send}
          disabled={busy}
          className="min-h-[52px] shrink-0 rounded-2xl btn-gradient px-5 font-bold text-white disabled:opacity-50"
        >
          {busy ? '...' : 'কোড পাঠাও'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-semibold text-brand">{error}</p>}
    </>
  );
}
