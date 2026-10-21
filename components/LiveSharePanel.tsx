'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SectionHeader from '@/components/SectionHeader';
import SosAlertContacts from '@/components/SosAlertContacts';
import { IconAlert, IconDroplet, IconNav, IconSend, IconUsers } from '@/components/icons';
import { getStoredToken, useMember } from '@/lib/member';
import { bnNum, timeAgoBn } from '@/lib/time';
import {
  BLOOD_GROUPS,
  LIVE_PURPOSE_LABEL,
  type LiveSharePurpose,
} from '@/lib/types';

const LS_KEY = 'jk_live_share';

const PURPOSE_META: {
  id: LiveSharePurpose;
  icon: React.ReactNode;
  activeClass: string;
}[] = [
  { id: 'danger', icon: <IconAlert className="h-6 w-6" />, activeClass: 'bg-red-500 ring-white/70' },
  { id: 'blood', icon: <IconDroplet className="h-6 w-6" />, activeClass: 'bg-rose-600 ring-white/70' },
  { id: 'help', icon: <IconUsers className="h-6 w-6" />, activeClass: 'bg-amber-500 ring-white/70' },
  { id: 'general', icon: <IconNav className="h-6 w-6" />, activeClass: 'bg-blue-600 ring-white/70' },
];

const GEO_ERROR = 'লোকেশন পাওয়া যাচ্ছে না — ফোনের লোকেশন চালু করে আবার চেষ্টা করুন';

interface SharingState {
  id: string;
  ownerToken: string;
  purpose: LiveSharePurpose;
  expiresAt: string;
}

interface WakeLockLike {
  release: () => Promise<void>;
}

async function requestWakeLock(): Promise<WakeLockLike | null> {
  try {
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: 'screen') => Promise<WakeLockLike> };
    };
    return (await nav.wakeLock?.request('screen')) ?? null;
  } catch {
    return null;
  }
}

function secondsAgoLabel(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 10) return 'এইমাত্র';
  if (s < 60) return `${bnNum(s)} সেকেন্ড আগে`;
  return timeAgoBn(iso);
}

export default function LiveSharePanel() {
  const { member } = useMember();
  const [purpose, setPurpose] = useState<LiveSharePurpose>('danger');
  const [bloodGroup, setBloodGroup] = useState('');
  const [note, setNote] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhone, setShowPhone] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [sharing, setSharing] = useState<SharingState | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0);

  const showPhoneTouched = useRef(false);
  const sharingRef = useRef<SharingState | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockLike | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number; accuracy: number | null } | null>(null);
  const lastPingRef = useRef(0);

  /* ---------- watcher plumbing ---------- */

  const clearWatchers = useCallback(() => {
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const endLocal = useCallback(
    (msg: string) => {
      clearWatchers();
      sharingRef.current = null;
      setSharing(null);
      setLastUpdated(null);
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      setInfo(msg);
    },
    [clearWatchers]
  );

  const ping = useCallback(
    async (pos: { lat: number; lng: number; accuracy: number | null }) => {
      const s = sharingRef.current;
      if (!s) return;
      lastPingRef.current = Date.now();
      try {
        const res = await fetch(`/api/live-shares/${s.id}/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            owner_token: s.ownerToken,
            lat: pos.lat,
            lng: pos.lng,
            accuracy: pos.accuracy,
          }),
        });
        if (res.status === 409) {
          endLocal('শেয়ারের মেয়াদ শেষ হয়ে গেছে (১ ঘণ্টা)। প্রয়োজনে আবার শুরু করুন।');
          return;
        }
        if (res.status === 403 || res.status === 404) {
          endLocal('শেয়ারটি বন্ধ হয়ে গেছে।');
          return;
        }
        if (res.ok) {
          const d = await res.json().catch(() => ({}));
          setLastUpdated(d.updated_at ?? new Date().toISOString());
        }
      } catch {
        /* network blip — the next tick retries */
      }
    },
    [endLocal]
  );

  const startWatchers = useCallback(() => {
    clearWatchers();
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const p = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy ?? null,
          };
          lastPosRef.current = p;
          if (Date.now() - lastPingRef.current >= 10_000) void ping(p);
        },
        () => {
          /* transient GPS errors — interval fallback keeps trying */
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 }
      );
    }
    intervalRef.current = setInterval(() => {
      const p = lastPosRef.current;
      if (p && Date.now() - lastPingRef.current >= 10_000) void ping(p);
    }, 20_000);
    void requestWakeLock().then((lock) => {
      wakeLockRef.current = lock;
    });
  }, [clearWatchers, ping]);

  /* ---------- resume an in-progress share (this browser) ---------- */

  useEffect(() => {
    let stored: { id?: string; owner_token?: string } | null = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = null;
    }
    if (!stored?.id || !stored?.owner_token) return;
    const { id, owner_token } = stored as { id: string; owner_token: string };
    (async () => {
      try {
        const res = await fetch(`/api/live-shares/${id}`, { cache: 'no-store' });
        if (!res.ok) throw new Error();
        const d = await res.json();
        if (!d.is_active) throw new Error();
        const s: SharingState = {
          id,
          ownerToken: owner_token,
          purpose: d.purpose,
          expiresAt: d.expires_at,
        };
        sharingRef.current = s;
        setSharing(s);
        setLastUpdated(d.updated_at);
        lastPosRef.current = { lat: d.lat, lng: d.lng, accuracy: d.accuracy ?? null };
        startWatchers();
      } catch {
        try {
          localStorage.removeItem(LS_KEY);
        } catch {
          /* ignore */
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* wake lock re-acquire + 5s ticker for "x সেকেন্ড আগে" */
  useEffect(() => {
    if (!sharing) return;
    const t = setInterval(() => setTick((x) => x + 1), 5000);
    const onVis = () => {
      if (document.visibilityState === 'visible' && sharingRef.current) {
        void requestWakeLock().then((lock) => {
          if (lock) wakeLockRef.current = lock;
        });
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [sharing]);

  /* unmount cleanup */
  useEffect(() => clearWatchers, [clearWatchers]);

  /* ---------- prefill identity from the member session ---------- */

  useEffect(() => {
    if (member) {
      setName((v) => v || member.name);
      setPhone((v) => v || member.phone || '');
    }
  }, [member]);

  function choosePurpose(p: LiveSharePurpose) {
    setPurpose(p);
    if (!showPhoneTouched.current) setShowPhone(p === 'danger' || p === 'blood');
  }

  /* ---------- start / stop ---------- */

  async function start() {
    setError('');
    setInfo('');
    if (!name.trim()) {
      setError('আপনার নাম লিখুন');
      return;
    }
    if (purpose === 'blood' && !bloodGroup) {
      setError('রক্তের গ্রুপ বেছে নিন');
      return;
    }
    if (!('geolocation' in navigator)) {
      setError(GEO_ERROR);
      return;
    }
    setStarting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 0,
        })
      );
      const token = getStoredToken();
      const res = await fetch('/api/live-shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-member-token': token } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          show_phone: showPhone,
          purpose,
          blood_group: purpose === 'blood' ? bloodGroup : null,
          note: purpose === 'blood' ? note.trim() || null : null,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'শেয়ার শুরু করা যায়নি');
      const s: SharingState = {
        id: data.id,
        ownerToken: data.owner_token,
        purpose,
        expiresAt: data.expires_at,
      };
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ id: s.id, owner_token: s.ownerToken }));
      } catch {
        /* ignore */
      }
      sharingRef.current = s;
      lastPosRef.current = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null,
      };
      lastPingRef.current = Date.now();
      setSharing(s);
      setLastUpdated(new Date().toISOString());
      startWatchers();
    } catch (e) {
      const isGeoErr =
        typeof e === 'object' && e !== null && 'code' in e && typeof (e as { code: unknown }).code === 'number';
      if (isGeoErr) {
        setError(GEO_ERROR);
      } else {
        setError(e instanceof Error ? e.message : 'শেয়ার শুরু করা যায়নি');
      }
    } finally {
      setStarting(false);
    }
  }

  async function stop() {
    const s = sharingRef.current;
    if (s) {
      try {
        await fetch(`/api/live-shares/${s.id}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner_token: s.ownerToken }),
        });
      } catch {
        /* stopping locally regardless */
      }
    }
    endLocal('লাইভ শেয়ার বন্ধ করা হয়েছে।');
  }

  /* ---------- sharing-state card ---------- */

  const shareUrl = sharing
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/live/${sharing.id}`
    : '';
  const shareText = sharing
    ? `${LIVE_PURPOSE_LABEL[sharing.purpose]} — আমার লাইভ লোকেশন দেখুন: ${shareUrl}`
    : '';
  const minutesLeft = sharing
    ? Math.max(0, Math.round((new Date(sharing.expiresAt).getTime() - Date.now()) / 60000))
    : 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — the link is visible to copy manually */
    }
  }

  return (
    <section className="mt-6 rounded-3xl bg-white/[0.07] p-4 ring-1 ring-white/10">
      <SectionHeader
        icon={<IconNav className="h-6 w-6" />}
        tileClassName="bg-red-500 text-white"
        title="লাইভ লোকেশন শেয়ার করুন"
        subtitle="এক ট্যাপে আপনার লাইভ অবস্থান পরিচিতদের কাছে পাঠান"
      />

      {info && (
        <p className="mt-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85">
          {info}
        </p>
      )}

      {!sharing ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="mb-2 text-sm font-bold text-white/85">কেন শেয়ার করছেন?</p>
            <div className="grid grid-cols-2 gap-2">
              {PURPOSE_META.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => choosePurpose(p.id)}
                  className={`flex min-h-11 items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left font-bold ring-2 transition ${
                    purpose === p.id
                      ? `${p.activeClass} text-white ring-2`
                      : 'bg-white/10 text-white/75 ring-transparent'
                  }`}
                >
                  {p.icon}
                  <span className="text-[15px] leading-tight">{LIVE_PURPOSE_LABEL[p.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {purpose === 'blood' && (
            <>
              <div>
                <p className="mb-2 text-sm font-bold text-white/85">রক্তের গ্রুপ</p>
                <div className="flex flex-wrap gap-2">
                  {BLOOD_GROUPS.map((gr) => (
                    <button
                      key={gr}
                      type="button"
                      onClick={() => setBloodGroup(gr)}
                      className={`min-h-11 rounded-full px-4 py-2 text-sm font-bold ${
                        bloodGroup === gr ? 'bg-rose-600 text-white' : 'bg-white/10 text-white/75'
                      }`}
                    >
                      {gr}
                    </button>
                  ))}
                </div>
              </div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="কোন হাসপাতালে? (ঐচ্ছিক)"
                className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-brand"
              />
            </>
          )}

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-brand"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            placeholder="ফোন নম্বর (ঐচ্ছিক)"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/40 outline-none focus:border-brand"
          />

          <button
            type="button"
            onClick={() => {
              showPhoneTouched.current = true;
              setShowPhone((v) => !v);
            }}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${
              showPhone ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-white/60'
            }`}
          >
            <span>আমার ফোন নম্বর দেখাবে</span>
            <span>{showPhone ? 'হ্যাঁ' : 'না'}</span>
          </button>

          {error && <p className="text-sm font-semibold text-red-300">{error}</p>}

          <button
            onClick={start}
            disabled={starting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl btn-danger py-4 font-bold disabled:opacity-60"
          >
            <IconSend className="h-5 w-5" />
            {starting ? 'লোকেশন নেওয়া হচ্ছে...' : 'লাইভ শেয়ার শুরু করুন'}
          </button>
          <p className="text-center text-xs leading-relaxed text-white/45">
            শেয়ার ১ ঘণ্টা পর্যন্ত চলবে। এই পেজ খোলা থাকলে লোকেশন লাইভ আপডেট হবে।
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
            <p className="font-bold">লাইভ শেয়ার চলছে</p>
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold">
              {LIVE_PURPOSE_LABEL[sharing.purpose]}
            </span>
          </div>
          <p className="text-sm text-white/65">
            সর্বশেষ আপডেট: {lastUpdated ? secondsAgoLabel(lastUpdated) : '...'} · মেয়াদ শেষ হতে
            বাকি প্রায় {bnNum(minutesLeft)} মিনিট
          </p>

          <div className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm text-white/85">{shareUrl}</span>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-white/15 px-3 py-2 text-xs font-bold"
            >
              {copied ? 'কপি হয়েছে ✓' : 'কপি করুন'}
            </button>
          </div>

          <div className="flex gap-2">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={() => navigator.share({ title: 'জনতার কথা — লাইভ লোকেশন', text: shareText }).catch(() => {})}
                className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-sm font-bold"
              >
                <IconSend className="h-4 w-4" /> শেয়ার
              </button>
            )}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-500 py-2.5 text-sm font-bold"
            >
              WhatsApp
            </a>
            <a
              href={`sms:?&body=${encodeURIComponent(shareText)}`}
              className="flex min-h-11 flex-1 items-center justify-center rounded-xl bg-white/15 py-2.5 text-sm font-bold"
            >
              SMS
            </a>
          </div>

          {/* Phase 11 — alert trusted contacts one-tap per contact */}
          <SosAlertContacts shareUrl={shareUrl} />

          <button
            onClick={stop}
            className="w-full rounded-2xl py-3.5 font-bold text-red-300 ring-1 ring-red-400/50"
          >
            শেয়ার বন্ধ করুন
          </button>
          <p className="text-center text-xs leading-relaxed text-white/45">
            এই পেজটি খোলা রাখুন — লোকেশন লাইভ আপডেট হতে থাকবে। পেজ বন্ধ করলে শেষ অবস্থানটাই
            থেকে যাবে।
          </p>
        </div>
      )}
    </section>
  );
}
