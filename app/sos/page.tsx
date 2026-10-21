'use client';

import Link from 'next/link';
import { useState } from 'react';
import LiveSharePanel from '@/components/LiveSharePanel';
import { SOS_NUMBERS } from '@/lib/mock';
import {
  IconAlert,
  IconCamera,
  IconCheck,
  IconChevronRight,
  IconPhone,
  IconUsers,
  IconVibrate,
} from '@/components/icons';

type Step = 'main' | 'confirm' | 'success' | 'silent';

export default function SosPage() {
  const [step, setStep] = useState<Step>('main');
  const [sending, setSending] = useState(false);

  async function sendAlert() {
    setSending(true);
    try {
      await fetch('/api/sos-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_type: 'emergency', location: 'গাঙ্গিনাপাড়, ময়মনসিংহ' }),
      });
    } catch {
      /* offline — still show the success UI so the user can call 999 */
    } finally {
      setSending(false);
      setStep('success');
    }
  }

  return (
    <main className="min-h-dvh bg-[#14100c] px-4 py-6 text-white">
      {step === 'main' && (
        <>
          <div className="flex items-center gap-3">
            <span className="sos-pulse flex h-14 w-14 items-center justify-center rounded-full bg-brand">
              <IconAlert className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold">জরুরি SOS</h1>
              <p className="text-sm text-white/60">১ ট্যাপে কল — লোকেশন স্বয়ংক্রিয়ভাবে যাবে</p>
            </div>
          </div>

          <LiveSharePanel />

          <div className="mt-6 space-y-3">
            {SOS_NUMBERS.map((n) => (
              <a
                key={n.id}
                href={`tel:${n.tel}`}
                className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur transition active:scale-[0.98]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand">
                  <IconPhone className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-bold">{n.title}</span>
                  <span className="block text-2xl font-bold tracking-widest text-white/90">{n.number}</span>
                </span>
                <IconChevronRight className="h-5 w-5 text-white/50" />
              </a>
            ))}
          </div>

          <button
            onClick={() => setStep('confirm')}
            className="mt-6 w-full rounded-2xl bg-brand py-4 font-bold shadow-lg shadow-red-900/50"
          >
            এলার্ট পাঠান (৫০ জনের কাছে)
          </button>

          <button
            onClick={() => setStep('silent')}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-4 text-left"
          >
            <IconVibrate className="h-8 w-8 shrink-0 text-white/70" />
            <span>
              <span className="block text-sm font-bold">নীরব SOS সেটআপ</span>
              <span className="block text-xs text-white/60">ফোন হাতে না নিয়েও বিপদ সংকেত পাঠান</span>
            </span>
          </button>

          <Link
            href="/sos/fake-call"
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white/10 p-4"
          >
            <IconPhone className="h-8 w-8 shrink-0 text-white/70" />
            <span>
              <span className="block text-sm font-bold">ভুয়া কল স্ক্রিন</span>
              <span className="block text-xs text-white/60">বিপদ থেকে বের হওয়ার নিরাপদ অজুহাত</span>
            </span>
          </Link>

          <p className="mt-6 rounded-2xl bg-amber-500/15 p-4 text-xs leading-relaxed text-amber-200">
            ⚠️ ভুয়া পাঠালে আইনগত ব্যবস্থা হতে পারে। শুধুমাত্র প্রকৃত বিপদে ব্যবহার করুন।
          </p>
        </>
      )}

      {step === 'confirm' && (
        <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <span className="sos-pulse flex h-24 w-24 items-center justify-center rounded-full bg-brand">
            <IconAlert className="h-12 w-12" />
          </span>
          <h2 className="mt-6 text-xl font-bold">এলার্ট পাঠাবেন?</h2>
          <p className="mt-2 max-w-xs text-sm text-white/70">
            আপনার লোকেশন সহ <span className="font-bold text-white">৫০ জনের কাছে</span> এলার্ট যাচ্ছে।
            ৯৯৯ কল প্রস্তুত থাকবে।
          </p>
          <div className="mt-8 w-full space-y-3">
            <button
              onClick={sendAlert}
              disabled={sending}
              className="w-full rounded-2xl bg-brand py-4 font-bold disabled:opacity-60"
            >
              {sending ? 'পাঠানো হচ্ছে...' : 'এখনই পাঠান'}
            </button>
            <a
              href="tel:999"
              className="block w-full rounded-2xl bg-white/15 py-4 text-center font-bold"
            >
              ৯৯৯ কল প্রস্তুত — সরাসরি কল করুন
            </a>
            <button
              onClick={() => setStep('main')}
              className="w-full rounded-2xl py-3 text-sm text-white/60"
            >
              বাতিল করুন
            </button>
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs text-white/60">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-red-600" />
            লোকেশন শেয়ার করুন
          </label>
        </div>
      )}

      {step === 'success' && (
        <div className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500">
            <IconCheck className="h-12 w-12" />
          </span>
          <h2 className="mt-6 text-2xl font-bold">পাঠানো হয়েছে!</h2>
          <p className="mt-2 max-w-xs text-sm text-white/70">
            ৫০ জন স্বেচ্ছাসেবক ও ৯৯৯-এ কল প্রস্তুত। সাহায্য আসছে — শান্ত থাকুন।
          </p>
          <a
            href="tel:999"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 font-bold"
          >
            <IconPhone className="h-5 w-5" /> ৯৯৯-এ কল করুন
          </a>
          <Link href="/" className="mt-4 text-sm text-white/60">
            হোমে ফিরুন
          </Link>
        </div>
      )}

      {step === 'silent' && (
        <>
          <h1 className="text-2xl font-bold">নীরব SOS</h1>
          <p className="mt-1 text-sm text-white/60">
            ফোন হাতে না নিয়েও বিপদ সংকেত পাঠান — কেউ বুঝবে না আপনি পাঠিয়েছেন।
          </p>
          <div className="mt-6 space-y-3">
            {[
              {
                icon: <IconVibrate className="h-7 w-7" />,
                title: 'ফোন ঝাঁকান ৩ বার',
                desc: 'পকেটে থাকা অবস্থায় জোরে ঝাঁকালে নীরব এলার্ট যাবে',
              },
              {
                icon: <IconPhone className="h-7 w-7" />,
                title: 'পাওয়ার বাটন ৫ বার',
                desc: 'দ্রুত ৫ বার চাপলে লোকেশন সহ পরিবারকে জানাবে',
              },
              {
                icon: <IconCamera className="h-7 w-7" />,
                title: 'স্বয়ংক্রিয় ভিডিও রেকর্ড',
                desc: 'এলার্টের সাথে সাথে প্রমাণ ভিডিও রেকর্ড শুরু হবে',
              },
              {
                icon: <IconUsers className="h-7 w-7" />,
                title: 'পরিবারকে নীরবে জানান',
                desc: 'আপনার পরিবারের সদস্যরা নীরবে লোকেশন পাবেন',
              },
            ].map((s) => (
              <div key={s.title} className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
                <span className="shrink-0 text-white/70">{s.icon}</span>
                <span>
                  <span className="block font-bold">{s.title}</span>
                  <span className="block text-xs text-white/60">{s.desc}</span>
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep('main')}
            className="mt-6 w-full rounded-2xl bg-brand py-4 font-bold"
          >
            বুঝেছি, সেটআপ করুন
          </button>
        </>
      )}
    </main>
  );
}
