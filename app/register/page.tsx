'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import LocationPicker, { EMPTY_LOCATION, type LocationSelection } from '@/components/LocationPicker';
import { loginMember, registerMember, useMember } from '@/lib/member';
import { IconCheck, IconUsers } from '@/components/icons';

const inputCls =
  'w-full rounded-2xl border border-[#efe3d3] bg-white px-4 py-3 text-[15px] outline-none focus:border-brand';

export default function RegisterPage() {
  const router = useRouter();
  const { member } = useMember();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [home, setHome] = useState<LocationSelection>(EMPTY_LOCATION);
  const [sameAsHome, setSameAsHome] = useState(true);
  const [current, setCurrent] = useState<LocationSelection>(EMPTY_LOCATION);
  const [visible, setVisible] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [loginPhone, setLoginPhone] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (member) router.replace('/profile');
  }, [member, router]);

  async function submit() {
    setError('');
    if (!name.trim()) return setError('আপনার নাম লিখুন');
    if (!home.division_id || !home.district_id || !home.upazila_id) {
      return setError('নিজ এলাকা (বিভাগ, জেলা, উপজেলা) বেছে নিন');
    }
    setBusy(true);
    try {
      await registerMember({
        name: name.trim(),
        phone: phone.trim(),
        home,
        current: sameAsHome ? home : current,
        is_visible: visible,
      });
      router.push('/amar-elaka');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'নিবন্ধন করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  async function doLogin() {
    setLoginError('');
    setLoginBusy(true);
    try {
      await loginMember(loginPhone.trim());
      router.push('/profile');
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'প্রবেশ করা যায়নি');
    } finally {
      setLoginBusy(false);
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
            নিবন্ধন করলে আপনার এলাকার জরিপে ভোট দিতে পারবেন এবং আপনার এলাকার মানুষ কে কোথায় আছেন তা
            স্বয়ংক্রিয়ভাবে দেখতে পারবেন।
          </p>

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
              <p className="mt-1 text-xs text-ink-soft">এই নম্বরটাই আপনার পরিচয় — পরে একই নম্বর দিয়ে প্রবেশ করতে পারবেন। নম্বরটি কখনো অন্য সদস্যদের দেখানো হয় না।</p>
            </div>

            <div className="rounded-2xl bg-cream p-4">
              <h2 className="mb-3 text-sm font-bold text-ink">নিজ এলাকা (স্থায়ী)</h2>
              <LocationPicker value={home} onChange={setHome} />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-cream p-4">
              <button
                type="button"
                onClick={() => setSameAsHome(!sameAsHome)}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${sameAsHome ? 'bg-emerald-500 text-white' : 'bg-white shadow-inner'}`}
              >
                {sameAsHome && <IconCheck className="h-4 w-4" />}
              </button>
              <span className="text-sm font-semibold text-ink">আমি বর্তমানে নিজ এলাকাতেই আছি</span>
            </label>

            {!sameAsHome && (
              <div className="rounded-2xl bg-cream p-4">
                <h2 className="mb-3 text-sm font-bold text-ink">বর্তমান এলাকা (এখন যেখানে আছেন)</h2>
                <LocationPicker value={current} onChange={setCurrent} />
              </div>
            )}

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-4">
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${visible ? 'bg-emerald-500 text-white' : 'bg-white shadow-inner'}`}
              >
                {visible && <IconCheck className="h-4 w-4" />}
              </button>
              <span className="text-sm text-ink">
                <span className="font-semibold">আমার এলাকার সদস্যদের কাছে আমাকে দেখান</span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  চালু রাখলে আপনার এলাকার মানুষ জানতে পারবে আপনি এখন কোন এলাকায় আছেন (শুধু এলাকার নাম, ফোন নম্বর নয়)।
                </span>
              </span>
            </label>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-brand">{error}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-2xl bg-brand py-4 font-bold text-white disabled:opacity-50"
            >
              {busy ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-3xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-bold text-ink">আগে থেকে নিবন্ধিত?</h2>
          <p className="mt-1 text-sm text-ink-soft">আপনার মোবাইল নম্বর দিয়ে প্রবেশ করুন।</p>
          <div className="mt-3 flex gap-2">
            <input
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="tel"
              className={inputCls}
            />
            <button
              onClick={doLogin}
              disabled={loginBusy}
              className="shrink-0 rounded-2xl bg-ink px-5 font-bold text-white disabled:opacity-50"
            >
              প্রবেশ
            </button>
          </div>
          {loginError && <p className="mt-2 text-sm font-semibold text-brand">{loginError}</p>}
        </div>
      </main>
      <BottomNav />
    </>
  );
}
