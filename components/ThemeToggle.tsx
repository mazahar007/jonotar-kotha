'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'jk-theme';
const DARK_META = '#161D2E';
const LIGHT_META = '#FFFFFF';

function applyTheme(next: 'dark' | 'light') {
  const dark = next === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable — theme still applies for this session */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? DARK_META : LIGHT_META);
}

/**
 * Phase 21 — sun/moon theme toggle. Lives in the floating header pill
 * (mobile + desktop). Persists to localStorage; the pre-paint script in
 * layout.tsx restores it before first paint (no FOUC).
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyTheme(next);
  };

  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'লাইট মোড চালু করুন' : 'ডার্ক মোড চালু করুন'}
      title={dark ? 'লাইট মোড' : 'ডার্ক মোড'}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-ink-soft transition hover:bg-overlay hover:text-ink"
    >
      {dark ? (
        /* sun — shown in dark mode, tap for light */
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
          />
        </svg>
      ) : (
        /* moon — shown in light mode, tap for dark */
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0012 21.75a9.753 9.753 0 009.752-6.748z"
          />
        </svg>
      )}
    </button>
  );
}
