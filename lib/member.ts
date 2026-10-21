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
  show_on_leaderboard?: boolean;
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

/* ---------- Phase 13: OTP auth (password-free) ---------- */

export type OtpPurpose = 'register' | 'login' | 'verify_phone';

export interface OtpSendResponse {
  ok: boolean;
  destination: string;
  channel: 'sms' | 'email';
  purpose: OtpPurpose;
  demo: boolean;
  demo_code?: string;
  demo_reason?: string;
  expires_in_ms: number;
}

async function postOtp(path: string, body: unknown): Promise<OtpSendResponse> {
  const res = await call(path, { method: 'POST', body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as Partial<OtpSendResponse> & { error?: string };
  if (!res.ok) throw new Error(data.error || 'কোড পাঠানো যায়নি');
  return data as OtpSendResponse;
}

/** Step 1 of registration: name + phone and/or email → OTP sent. */
export async function registerWithOtp(input: { name: string; phone?: string; email?: string }): Promise<OtpSendResponse> {
  return postOtp('/api/member-auth/register', input);
}

/** OTP login: send a login code to an existing phone/email. */
export async function loginWithOtp(destination: string): Promise<OtpSendResponse> {
  return postOtp('/api/member-auth/login', { destination });
}

/** Logged-in member adds a phone (email-only → verified after OTP). */
export async function addPhoneWithOtp(phone: string): Promise<OtpSendResponse> {
  return postOtp('/api/member-auth/add-phone', { phone });
}

/** Step 2: verify the 6-digit code. Stores the session on success. */
export async function verifyOtpCode(input: {
  destination: string;
  code: string;
  purpose: OtpPurpose;
}): Promise<MemberSelfPayload> {
  const res = await call('/api/member-auth/verify-otp', { method: 'POST', body: JSON.stringify(input) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'যাচাই করা যায়নি');
  const member = data.member as MemberSelfPayload;
  // register/login issue a fresh session; verify_phone keeps the existing one.
  if (data.token) storeSession(member, data.token as string);
  try {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  } catch {
    /* ignore */
  }
  return member;
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
