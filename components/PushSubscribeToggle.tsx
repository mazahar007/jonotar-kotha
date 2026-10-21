'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconBell, IconCheck } from './icons';

type Status = 'checking' | 'unsupported' | 'no-vapid' | 'denied' | 'off' | 'on';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Phase 8 — "নোটিফিকেশন চালু করো" toggle on the (login-free) profile page.
 * Standard VAPID browser flow: register /sw.js → permission → subscribe →
 * POST /api/push/subscribe. Honest about missing VAPID keys in demo mode.
 */
export default function PushSubscribeToggle({ memberId }: { memberId: number | null }) {
  const [status, setStatus] = useState<Status>('checking');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'on' : Notification.permission === 'denied' ? 'denied' : 'off');
    } catch {
      setStatus('unsupported');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function enable() {
    setBusy(true);
    setMsg('');
    try {
      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const keyRes = await fetch('/api/push/vapid-key', { cache: 'no-store' });
      const { publicKey } = (await keyRes.json()) as { publicKey: string | null };
      if (!publicKey) {
        // Honest demo path: no keys configured on the server.
        setStatus('no-vapid');
        setMsg('সার্ভারে এখনো পুশ কী বসানো হয়নি — নোটিফিকেশন বেল 🔔 থেকে ইন-অ্যাপে দেখতে পাবেন।');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
          member_id: memberId,
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setStatus('on');
      setMsg('পুশ নোটিফিকেশন চালু হয়েছে ✓');
    } catch {
      setMsg('চালু করা যায়নি — আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMsg('');
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('off');
      setMsg('পুশ নোটিফিকেশন বন্ধ করা হয়েছে');
    } catch {
      setMsg('বন্ধ করা যায়নি — আবার চেষ্টা করুন');
    } finally {
      setBusy(false);
    }
  }

  const on = status === 'on';
  const blocked = status === 'denied';
  const unavailable = status === 'unsupported' || status === 'no-vapid';

  return (
    <div className="rounded-3xl bg-surface border border-white/10 p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-violet-300">
          <IconBell className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">পুশ নোটিফিকেশন</p>
          <p className="text-xs leading-snug text-ink-soft">
            {status === 'checking' && 'যাচাই হচ্ছে...'}
            {status === 'unsupported' && 'এই ব্রাউজারে পুশ নোটিফিকেশন সাপোর্ট করে না'}
            {status === 'denied' && 'ব্রাউজার সেটিংস থেকে অনুমতি দিন, তারপর আবার চেষ্টা করুন'}
            {status === 'no-vapid' && 'ইন-অ্যাপ নোটিফিকেশন কেন্দ্র (🔔 বেল) চালু আছে'}
            {status === 'off' && 'জরুরি খবর ও এলাকার আপডেট সরাসরি ফোনে পান'}
            {status === 'on' && 'চালু আছে — জরুরি খবর সরাসরি ফোনে পাবেন'}
          </p>
        </div>
        {!unavailable && (
          <button
            onClick={on ? disable : enable}
            disabled={busy || blocked}
            aria-pressed={on}
            aria-label={on ? 'পুশ নোটিফিকেশন বন্ধ করুন' : 'পুশ নোটিফিকেশন চালু করুন'}
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
              on ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow transition-all ${
                on ? 'left-7' : 'left-1'
              }`}
            >
              {on && <IconCheck className="h-4 w-4 text-emerald-400" />}
            </span>
          </button>
        )}
      </div>
      {unavailable && (
        <button
          onClick={refresh}
          className="mt-3 min-h-11 w-full rounded-2xl bg-cream-dark text-sm font-bold text-ink"
        >
          আবার যাচাই করুন
        </button>
      )}
      {msg && (
        <p className={`mt-3 text-xs font-semibold ${on ? 'text-emerald-300' : 'text-ink-soft'}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
