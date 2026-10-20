'use client';

import { useCallback, useEffect, useState } from 'react';
import type { MemberSelfPayload } from './member-session';
import type { LocationIds } from './types';

export type { MemberSelfPayload };

const TOKEN_KEY = 'jk_member_token';
const MEMBER_KEY = 'jk_member';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeSession(member: MemberSelfPayload, token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  } catch {
    /* private mode — cookie session still works */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
  } catch {
    /* ignore */
  }
}

async function call(path: string, init?: RequestInit): Promise<Response> {
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

export async function registerMember(input: {
  name: string;
  phone: string;
  home: LocationIds;
  current: LocationIds;
  is_visible: boolean;
}): Promise<MemberSelfPayload> {
  const res = await call('/api/members/register', { method: 'POST', body: JSON.stringify(input) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'নিবন্ধন করা যায়নি');
  storeSession(data.member, data.token);
  return data.member as MemberSelfPayload;
}

export async function loginMember(phone: string): Promise<MemberSelfPayload> {
  const res = await call('/api/members/login', { method: 'POST', body: JSON.stringify({ phone }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'প্রবেশ করা যায়নি');
  storeSession(data.member, data.token);
  return data.member as MemberSelfPayload;
}

export async function fetchMe(): Promise<MemberSelfPayload | null> {
  if (!getStoredToken()) return null;
  const res = await call('/api/members/me');
  if (!res.ok) {
    clearSession();
    return null;
  }
  const member = (await res.json()) as MemberSelfPayload;
  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  } catch {
    /* ignore */
  }
  return member;
}

export async function updateMe(patch: {
  name?: string;
  is_visible?: boolean;
  current?: LocationIds;
}): Promise<MemberSelfPayload> {
  const res = await call('/api/members/me', { method: 'PATCH', body: JSON.stringify(patch) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'আপডেট করা যায়নি');
  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
  return data as MemberSelfPayload;
}

export async function logoutMember(): Promise<void> {
  try {
    await call('/api/members/logout', { method: 'POST' });
  } catch {
    /* ignore */
  }
  clearSession();
}

/** React hook: undefined = loading, null = not registered, otherwise the member. */
export function useMember() {
  const [member, setMember] = useState<MemberSelfPayload | null | undefined>(undefined);

  const refresh = useCallback(async () => {
    setMember(await fetchMe());
  }, []);

  useEffect(() => {
    let alive = true;
    fetchMe().then((m) => {
      if (alive) setMember(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  return { member, setMember, refresh };
}
