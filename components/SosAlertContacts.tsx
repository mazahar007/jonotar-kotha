'use client';

import { useEffect, useState } from 'react';
import { IconSend } from '@/components/icons';
import { getStoredToken, useMember } from '@/lib/member';

/** 01711000001 → 8801711000001 for wa.me deep links. */
function toWaNumber(phone: string): string {
  const p = phone.trim();
  return p.startsWith('880') ? p : `880${p.slice(1)}`;
}

interface Contact {
  id: number;
  name: string;
  phone: string;
}

/**
 * Phase 11 — "পরিচিতদের জানাও": when a live-share is active, show the
 * member's trusted contacts with a one-tap WhatsApp button per contact
 * (prefilled Bengali SOS message containing the live link) and a
 * per-contact copy-link button.
 *
 * Honest note: a website cannot send SMS by itself. Alerting works through
 * WhatsApp deep links plus copy-paste — the UI says exactly that, and makes
 * no "SMS sent" claims.
 */
export default function SosAlertContacts({ shareUrl }: { shareUrl: string }) {
  const { member } = useMember();
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!member) {
      setContacts([]);
      return;
    }
    const token = getStoredToken();
    (async () => {
      try {
        const res = await fetch('/api/contacts', {
          headers: token ? { 'x-member-token': token } : {},
        });
        if (!res.ok) throw new Error();
        setContacts((await res.json()) as Contact[]);
      } catch {
        setContacts([]);
      }
    })();
  }, [member]);

  if (contacts === null || contacts.length === 0) return null;

  const message = `🆘 আমি বিপদে আছি — আমার লাইভ লোকেশন দেখুন: ${shareUrl} — জনতার কথা`;

  async function copyFor(c: Contact) {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedId(c.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable — the link row above stays copyable */
    }
  }

  return (
    <div className="rounded-2xl bg-overlay p-3 ring-1 ring-white/10">
      <p className="text-sm font-bold text-white">📢 পরিচিতদের জানাও</p>
      <p className="mt-1 text-xs leading-relaxed text-white/55">
        WhatsApp-এ এক ট্যাপে জানান, অথবা লিংক কপি করে SMS/অন্য অ্যাপে পাঠান।
      </p>
      <ul className="mt-2.5 space-y-2">
        {contacts.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-2.5 rounded-xl bg-black/25 p-2.5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-overlay-strong text-sm font-bold text-white">
              {c.name.charAt(0)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-white">{c.name}</span>
              <span className="block text-xs text-white/55">{c.phone}</span>
            </span>
            <a
              href={`https://wa.me/${toWaNumber(c.phone)}?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              aria-label={`${c.name}-কে WhatsApp-এ জানান`}
              className="flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2.5 text-sm font-bold text-white"
            >
              <IconSend className="h-4 w-4" /> WhatsApp
            </a>
            <button
              onClick={() => copyFor(c)}
              aria-label={`${c.name}-এর জন্য লিংক কপি`}
              className="min-h-11 shrink-0 rounded-xl bg-overlay-strong px-3 py-2.5 text-xs font-bold text-white"
            >
              {copiedId === c.id ? 'কপি ✓' : 'লিংক কপি'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
