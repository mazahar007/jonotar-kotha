'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import BottomNav from '@/components/BottomNav';
import SectionHeader from '@/components/SectionHeader';
import { IconBell, IconChevronRight } from '@/components/icons';
import { NOTIF_LAST_READ_KEY } from '@/components/NotificationBell';

interface Notif {
  id: number;
  title: string;
  body: string;
  url: string | null;
  kind: string;
  created_at: string;
  time_ago: string;
}

/**
 * Phase 8 — in-app notification center (/notifications).
 * Works WITHOUT VAPID keys: every broadcast is recorded here.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function markAllRead() {
    localStorage.setItem(NOTIF_LAST_READ_KEY, new Date().toISOString());
    load();
  }

  return (
    <>
      <main className="min-h-dvh bg-cream px-4 py-6 lg:px-6">
        <SectionHeader
          icon={<IconBell className="h-6 w-6" />}
          tileClassName="bg-[#efe9ff] text-[#5b3df0]"
          title="নোটিফিকেশন"
          subtitle="এলাকার জরুরি খবর, রোড আপডেট আর ঘোষণা — সব এখানে"
          as="h1"
          action={
            items.length > 0 ? (
              <button
                onClick={markAllRead}
                className="flex min-h-11 shrink-0 items-center rounded-full bg-white px-4 text-xs font-bold text-ink-soft shadow-sm"
              >
                সব পড়া হয়েছে
              </button>
            ) : undefined
          }
        />

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-soft">লোড হচ্ছে...</p>
        ) : items.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white p-8 text-center text-sm text-ink-soft">
            এখনো কোনো নোটিফিকেশন নেই।
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((n) => {
              const card = (
                <span className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#efe9ff] text-[#5b3df0]">
                    <IconBell className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-ink">{n.title}</span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{n.body}</span>
                    <span className="mt-1 block text-xs text-ink-soft">{n.time_ago}</span>
                  </span>
                  {n.url && <IconChevronRight className="h-5 w-5 shrink-0 self-center text-ink-soft" />}
                </span>
              );
              return (
                <li key={n.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  {n.url ? (
                    <Link href={n.url} className="block min-h-11">
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-8 text-center text-xs text-ink-soft">জনতার কথা · ময়মনসিংহ</p>
      </main>
      <BottomNav />
    </>
  );
}
