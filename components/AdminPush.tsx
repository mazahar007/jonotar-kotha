'use client';

import { useEffect, useState } from 'react';
import { IconBell, IconSend } from './icons';
import { bnNum } from '@/lib/time';

interface SendResult {
  delivered: 'push' | 'inapp';
  reason?: string;
  pushSent: number;
  pushFailed: number;
  pruned: number;
  inappId: number;
}

/**
 * Phase 8 — admin "টেস্ট নোটিফিকেশন" tab.
 * Sends to all subscribers (web-push when VAPID keys exist), and ALWAYS
 * records the message in the in-app center. Shows the honest delivery
 * result — including the no-VAPID-keys fallback.
 */
export default function AdminPush() {
  const [subs, setSubs] = useState<number | null>(null);
  const [vapid, setVapid] = useState<boolean | null>(null);
  const [title, setTitle] = useState('জনতার কথা');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/push/send', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.subscriptions === 'number') setSubs(d.subscriptions);
        if (typeof d.vapidConfigured === 'boolean') setVapid(d.vapidConfigured);
      })
      .catch(() => {});
  }, []);

  async function send() {
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || '/' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'পাঠানো যায়নি');
        return;
      }
      setResult(data as SendResult);
      setBody('');
      // Refresh subscriber count (dead endpoints may have been pruned).
      const s = await fetch('/api/push/send', { cache: 'no-store' }).then((r) => r.json());
      if (typeof s.subscriptions === 'number') setSubs(s.subscriptions);
    } catch {
      setError('পাঠানো যায়নি');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#efe9ff] text-[#5b3df0]">
          <IconBell className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">টেস্ট নোটিফিকেশন</p>
          <p className="text-xs text-ink-soft">
            {subs === null
              ? 'লোড হচ্ছে...'
              : `${bnNum(subs)}টি ডিভাইস সাবস্ক্রাইবড · ${
                  vapid ? 'VAPID কী সেট আছে' : 'VAPID কী নেই (শুধু ইন-অ্যাপে যাবে)'
                }`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink-soft">শিরোনাম</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink-soft">বার্তা</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="যেমন: গাঙ্গিনাপাড়ে বিদ্যুৎ বিভ্রাট — সবাই সতর্ক থাকুন"
            className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold text-ink-soft">লিংক (ট্যাপ করলে কোথায় যাবে)</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/"
            className="w-full rounded-xl border border-[#efe3d3] bg-cream px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>

      <button
        onClick={send}
        disabled={busy || !title.trim() || !body.trim()}
        className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        <IconSend className="h-4 w-4" />
        {busy ? 'পাঠানো হচ্ছে...' : 'সবাইকে পাঠান'}
      </button>

      {error && <p className="mt-3 text-sm font-semibold text-brand">{error}</p>}
      {result && (
        <div className="mt-3 rounded-2xl bg-cream p-4 text-sm">
          {result.delivered === 'push' ? (
            <p className="font-semibold text-emerald-700">
              ✓ {bnNum(result.pushSent)}টি ডিভাইসে পুশ পাঠানো হয়েছে
              {result.pushFailed > 0 && ` (${bnNum(result.pushFailed)}টি ব্যর্থ)`}
              {result.pruned > 0 && ` · ${bnNum(result.pruned)}টি মৃত সাবস্ক্রিপশন মুছে ফেলা হয়েছে`}
              <span className="block text-xs font-normal text-ink-soft">
                ইন-অ্যাপ কেন্দ্রেও রেকর্ড করা হয়েছে।
              </span>
            </p>
          ) : (
            <p className="font-semibold text-amber-700">
              VAPID কী সেট করা হয়নি — নোটিফিকেশন শুধু ইন-অ্যাপ কেন্দ্রে (🔔 বেল) দেখানো হয়েছে।
              <span className="block text-xs font-normal text-ink-soft">
                ব্রাউজার পুশ চাইলে সার্ভারে VAPID কী বসান (README-SETUP-BN.md দেখুন)।
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
