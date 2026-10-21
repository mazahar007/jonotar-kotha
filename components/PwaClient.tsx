'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconChevronRight } from './icons';

/**
 * Phase 12 — PWA install + SW registration (hand-rolled, no new dependency).
 */

/** Registers /sw.js on the client once (rendered from the root layout). */
export function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* graceful: app still works without the SW */
      });
    }
  }, []);
  return null;
}

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

/**
 * "অ্যাপ ইনস্টল করো" button using beforeinstallprompt.
 * Gracefully hidden when: SW unsupported, event never fires (already installed
 * or browser doesn't offer install), or after a successful install.
 */
export function InstallAppButton() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Already installed? (standalone display or iOS navigator.standalone)
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setMsg('অ্যাপ ইনস্টল হয়ে গেছে ✓');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    setBusy(true);
    setMsg('');
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        setMsg('ইনস্টল হচ্ছে...');
      } else {
        setMsg('পরে প্রোফাইল থেকে আবার চেষ্টা করতে পারবেন');
        setDeferred(null);
      }
    } catch {
      setMsg('ইনস্টল করা যায়নি — আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  if (installed) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-surface border border-line p-4 shadow-sm">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <IconCheck className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold text-ink">অ্যাপ ইনস্টল আছে</span>
          <span className="block text-xs text-ink-soft">হোম স্ক্রিন থেকে সরাসরি খুলুন</span>
        </span>
      </div>
    );
  }

  if (!deferred) return null; // graceful hide: browser doesn't offer install

  return (
    <div className="rounded-2xl bg-surface border border-line p-4 shadow-sm">
      <button
        onClick={install}
        disabled={busy}
        className="flex min-h-11 w-full items-center gap-3 rounded-2xl bg-red-500 px-4 py-2 text-left text-white disabled:opacity-50"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-overlay-strong">
          <IconChevronRight className="h-6 w-6" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-bold">অ্যাপ ইনস্টল করো</span>
          <span className="block text-xs text-ink-soft">হোম স্ক্রিনে রাখুন — অফলাইনেও কিছু তথ্য দেখুন</span>
        </span>
      </button>
      {msg && <p className="mt-2 text-xs font-semibold text-ink-soft">{msg}</p>}
    </div>
  );
}
