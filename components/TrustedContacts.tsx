'use client';

import { useCallback, useEffect, useState } from 'react';
import { IconSend, IconShield } from '@/components/icons';
import { getStoredToken } from '@/lib/member';

/** 01711000001 → 8801711000001 for wa.me deep links. */
function toWaNumber(phone: string): string {
  const p = phone.trim();
  return p.startsWith('880') ? p : `880${p.slice(1)}`;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
  created_at: string;
}

async function call(path: string, init?: RequestInit) {
  const token = getStoredToken();
  return fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-member-token': token } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Phase 11 — "আমার পরিচিতজন": a logged-in member's trusted contacts.
 * Add (name + BD phone validation 01XXXXXXXXX), list, delete.
 * Privacy: only the owning member + admin can see these; the API returns
 * 401 when logged out, and that privacy is stated in the subtitle.
 */
export default function TrustedContacts() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');

  const load = useCallback(async () => {
    const res = await call('/api/contacts');
    if (!res.ok) {
      setContacts([]);
      return;
    }
    setContacts((await res.json()) as Contact[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function add() {
    setError('');
    setOkMsg('');
    if (!name.trim()) {
      setError('নাম লিখুন');
      return;
    }
    if (!/^01\d{9}$/.test(phone.trim())) {
      setError('সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)');
      return;
    }
    setBusy(true);
    try {
      const res = await call('/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'যোগ করা যায়নি');
      setName('');
      setPhone('');
      setOkMsg('পরিচিতজন যোগ হয়েছে');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'যোগ করা যায়নি');
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Contact) {
    if (!window.confirm(`"${c.name}"-কে মুছে ফেলবেন?`)) return;
    try {
      const res = await call(`/api/contacts/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      setError('মুছে ফেলা যায়নি');
    }
  }

  return (
    <div className="mt-4 rounded-3xl bg-surface border border-line p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-brand">
          <IconShield className="h-5 w-5" />
        </span>
        আমার পরিচিতজন
      </h2>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
        🔒 এই তালিকা শুধু আপনি ও অ্যাডমিন দেখতে পারবেন — অন্য কেউ দেখতে পাবে না।
        SOS শেয়ার চালু করলে এদের WhatsApp-এ এক ট্যাপে জানাতে পারবেন।
      </p>

      {contacts === null ? (
        <p className="py-4 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
      ) : (
        <>
          {contacts.length > 0 && (
            <ul className="mt-3 space-y-2">
              {contacts.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl bg-cream p-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold text-ink">
                    {c.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">{c.name}</span>
                    <span className="block text-xs text-ink-soft">{c.phone}</span>
                  </span>
                  <a
                    href={`https://wa.me/${toWaNumber(c.phone)}?text=${encodeURIComponent('জনতার কথা — আমার পরিচিতজনের তালিকায় আপনি যুক্ত আছেন।')}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${c.name}-কে WhatsApp করুন`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-emerald-500 px-3 text-sm font-bold text-white"
                  >
                    <IconSend className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => remove(c)}
                    aria-label={`${c.name}-কে মুছুন`}
                    className="min-h-11 min-w-11 rounded-xl bg-surface border border-line px-3 text-sm font-bold text-brand ring-1 ring-brand/30"
                  >
                    মুছুন
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 grid gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="নাম"
              maxLength={60}
              className="w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-brand"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 11))}
              placeholder="মোবাইল নম্বর (01XXXXXXXXX)"
              inputMode="tel"
              className="w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm text-ink outline-none focus:border-brand"
            />
            <button
              onClick={add}
              disabled={busy}
              className="min-h-11 w-full rounded-2xl btn-gradient py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? 'যোগ হচ্ছে...' : 'পরিচিতজন যোগ করুন'}
            </button>
          </div>
          {error && <p className="mt-2 text-xs font-semibold text-brand">{error}</p>}
          {okMsg && <p className="mt-2 text-xs font-semibold text-emerald-300">{okMsg}</p>}
        </>
      )}
    </div>
  );
}
