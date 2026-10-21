'use client';

/** Stable anonymous voter id stored in localStorage ("a:…" keys). */
const KEY = 'jk_voter';

export function getAnonVoterKey(): string {
  try {
    let v = localStorage.getItem(KEY);
    if (!v) {
      const rand =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
      v = `a:${rand}`;
      localStorage.setItem(KEY, v);
    }
    return v;
  } catch {
    return `a:${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
}

/** Logged-in member's voter key ("m:<id>"), else the anonymous key. */
export function resolveVoterKey(memberId: number | null): string {
  return memberId != null ? `m:${memberId}` : getAnonVoterKey();
}
