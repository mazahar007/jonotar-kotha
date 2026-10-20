import { NextRequest, NextResponse } from 'next/server';
import { err } from '@/lib/api';
import { createMemberToken, MEMBER_COOKIE } from '@/lib/member-auth';
import { memberSelfPayload } from '@/lib/member-session';
import { createMemberRow, getMemberRowByPhone, normalizePhone, rowToMember } from '@/lib/members-store';
import type { LocationIds } from '@/lib/types';

function parseIds(v: unknown): LocationIds {
  const o = (v ?? {}) as Record<string, unknown>;
  const n = (x: unknown) => {
    const num = Number(x);
    return x != null && x !== '' && !Number.isNaN(num) ? num : null;
  };
  return {
    division_id: n(o.division_id),
    district_id: n(o.district_id),
    upazila_id: n(o.upazila_id),
    thana_id: n(o.thana_id),
    union_id: n(o.union_id),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const phone = normalizePhone(body.phone);
  if (!name) return err('আপনার নাম লিখুন');
  if (!/^01\d{9}$/.test(phone) && !/^\d{10,14}$/.test(phone)) {
    return err('সঠিক মোবাইল নম্বর দিন (যেমন 01XXXXXXXXX)');
  }
  const home = parseIds(body.home);
  if (!home.division_id || !home.district_id || !home.upazila_id) {
    return err('নিজ এলাকা (বিভাগ, জেলা, উপজেলা) বেছে নিন');
  }
  const current = body.current ? parseIds(body.current) : home;

  const existing = await getMemberRowByPhone(phone);
  if (existing) {
    return Response.json(
      { error: 'এই নম্বর দিয়ে আগেই নিবন্ধন করা হয়েছে — ফোন নম্বর দিয়ে প্রবেশ করুন', code: 'exists' },
      { status: 409 }
    );
  }

  const row = await createMemberRow({
    name,
    phone,
    home,
    current,
    is_visible: body.is_visible !== false,
  });
  const member = rowToMember(row);
  const token = await createMemberToken(member.id);
  const res = NextResponse.json({ member: await memberSelfPayload(member), token }, { status: 201 });
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  });
  return res;
}
