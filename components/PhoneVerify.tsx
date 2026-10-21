'use client';

import { useState } from 'react';
import OtpStep from './OtpStep';
import { addPhoneWithOtp, type MemberSelfPayload, type OtpSendResponse } from '@/lib/member';

const inputCls =
  'w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand';

/**
 * Phase 13 — phone verification for a logged-in member.
 * - Email-only account (no phone): "ফোন যোগ করো" → add phone + OTP → verified.
 * - Phone exists but not verified (legacy phone-session members): "ফোন নম্বর যাচাই করুন".
 */
export default function PhoneVerify({
  member,
  onVerified,
}: {
  member: MemberSelfPayload;
  onVerified: (m: MemberSelfPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(member.phone ?? '');
  const [sent, setSent] = useState<OtpSendResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (member.phone_verified) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 min-h-[48px] w-full rounded-2xl bg-amber-500/15 py-3 text-sm font-bold text-amber-300"
      >
        {member.phone ? 'ফোন নম্বর যাচাই করুন' : 'ফোন যোগ করো'}
      </button>
    );
  }

  async function send() {
    setError('');
    if (!phone.trim()) return setError('মোবাইল নম্বর দিন');
    setBusy(true);
    try {
      setSent(await addPhoneWithOtp(phone.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'কোড পাঠানো যায়নি');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl bg-cream p-4">
      {!sent ? (
        <>
          <label className="mb-1.5 block text-sm font-bold text-ink">মোবাইল নম্বর</label>
          <div className="flex gap-2">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
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
          <button
            onClick={() => {
              setOpen(false);
              setSent(null);
              setError('');
            }}
            className="mt-2 min-h-[44px] w-full text-sm font-bold text-ink-soft"
          >
            বাতিল
          </button>
        </>
      ) : (
        <OtpStep
          destination={sent.destination}
          channel={sent.channel}
          purpose="verify_phone"
          initialDemo={sent.demo}
          initialDemoCode={sent.demo_code}
          onResend={() => addPhoneWithOtp(phone.trim())}
          onCancel={() => setSent(null)}
          onVerified={onVerified}
        />
      )}
    </div>
  );
}
