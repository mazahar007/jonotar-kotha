'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconLock } from '@/components/icons';

const DEMO_HINT = '1234';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/admin';
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ভুল পাসকোড');
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ভুল পাসকোড');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-cream px-6">
      <div className="flex w-full max-w-xs flex-col items-center lg:max-w-md lg:rounded-3xl lg:bg-surface lg:p-10 lg:shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
      <span className="flex h-16 w-16 items-center justify-center rounded-full btn-gradient text-white">
        <IconLock className="h-8 w-8" />
      </span>
      <h1 className="mt-4 text-xl font-bold text-ink">অ্যাডমিন লগইন</h1>
      <p className="mt-1 text-sm text-ink-soft">প্যানেল খুলতে পাসকোড দিন</p>
      <form onSubmit={submit} className="mt-6 w-full max-w-xs space-y-3 lg:max-w-none">
        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="পাসকোড"
          autoFocus
          className="w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-brand"
        />
        {error && <p className="text-center text-sm font-semibold text-brand">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl btn-gradient py-3.5 font-bold text-white disabled:opacity-60"
        >
          {busy ? 'যাচাই হচ্ছে...' : 'প্রবেশ করুন'}
        </button>
      </form>
      <p className="mt-4 text-xs text-ink-soft">
        ডেমো পাসকোড: <span className="font-bold">{DEMO_HINT}</span> (Supabase সেট না থাকলে)
      </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
