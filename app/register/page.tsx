'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import MemberOtpLogin from '@/components/MemberOtpLogin';
import OtpStep from '@/components/OtpStep';
import { registerWithOtp, useMember, type OtpSendResponse } from '@/lib/member';
import { IconCheck, IconUsers } from '@/components/icons';

const inputCls =
  'w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand';

export default function RegisterPage() {
  const router = useRouter();
  const { member, setMember } = useMember();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState<OtpSendResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (member) router.replace('/profile');
  }, [member, router]);

  async function sendCode() {
    setError('');
    if (!name.trim()) return setError('আপনার নাম লিখুন');
    if (!phone.trim() && !email.trim()) return setError('মোবাইল নম্বর অথবা ইমেইল — অন্তত একটি দিন');
    setBusy(true);
    try {
      setSent(await registerWithOtp({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'নিবন্ধন করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-2xl px-4 py-6">
        <div className="rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700">
            <IconUsers className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-ink">সদস্য নিবন্ধন</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            নাম ও মোবাইল নম্বর/ইমেইল দিন — ৬ সংখ্যার কোড দিয়ে যাচাই করলেই নিবন্ধন সম্পন্ন হবে। কোনো
            পাসওয়ার্ড লাগে না।
          </p>

          {!sent ? (
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">আপনার নাম</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: মোঃ আরিফুল ইসলাম" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">মোবাইল নম্বর</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  inputMode="tel"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">ইমেইল (ঐচ্ছিক)</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  inputMode="email"
                  className={inputCls}
                />
              </div>
              <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>মোবাইল নম্বর যাচাই করলে অ্যাকাউন্ট সম্পূর্ণ ভেরিফাইড হয়। শুধু ইমেইল দিয়ে নিবন্ধন করলে পরে ফোন নম্বর যোগ করে ভেরিফাই করতে হবে। নম্বর/ইমেইল কখনো অন্য সদস্যদের দেখানো হয় না।</span>
              </p>

              {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

              <button
                onClick={sendCode}
                disabled={busy}
                className="min-h-[52px] w-full rounded-2xl bg-brand py-4 font-bold text-white disabled:opacity-50"
              >
                {busy ? 'কোড পাঠানো হচ্ছে...' : 'কোড পাঠাও'}
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <OtpStep
                destination={sent.destination}
                channel={sent.channel}
                purpose="register"
                initialDemo={sent.demo}
                initialDemoCode={sent.demo_code}
                onResend={() => registerWithOtp({ name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined })}
                onCancel={() => setSent(null)}
                onVerified={(m) => {
                  setMember(m);
                  router.push('/profile');
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">আগে থেকে নিবন্ধিত?</h2>
          <p className="mt-1 text-sm text-ink-soft">আপনার মোবাইল নম্বর বা ইমেইলে পাঠানো কোড দিয়ে প্রবেশ করুন।</p>
          <div className="mt-3">
            <MemberOtpLogin />
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
