/**
 * Demo-mode data for Phase 3 (members / surveys / responses).
 * Used when Supabase is not configured — the same fallback pattern as
 * lib/mock.ts and lib/locations.ts.
 *
 * Seed members: mostly home = ময়মনসিংহ সদর (কোতোয়ালী মডেল থানা, various
 * unions); a few are currently away in ঢাকা / চট্টগ্রাম / other upazilas so
 * "আমার এলাকার মানুষ" demos well. Location IDs match lib/locations.ts.
 * NOTE: these phone numbers are demo placeholders, never shown publicly.
 */

export interface MemberRow {
  id: number;
  name: string;
  phone: string | null;
  // Phase 13: email + OTP verification state. phone became nullable
  // (email-only accounts); old rows always have a phone.
  email: string | null;
  phone_verified: boolean;
  email_verified: boolean;
  account_status: 'verified' | 'unverified';
  // Phase 15 columns (exposed already so /api/members/me has them).
  points: number;
  badges: string[];
  // Phase 15: activity timestamp for the inactivity penalty + leaderboard opt-in.
  last_active_at?: string | null;
  show_on_leaderboard?: boolean;
  home_division_id: number | null;
  home_district_id: number | null;
  home_upazila_id: number | null;
  home_thana_id: number | null;
  home_union_id: number | null;
  current_division_id: number | null;
  current_district_id: number | null;
  current_upazila_id: number | null;
  current_thana_id: number | null;
  current_union_id: number | null;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface SurveyRow {
  id: number;
  question: string;
  options: string[];
  target_level: 'all' | 'division' | 'district' | 'upazila' | 'thana' | 'union';
  target_id: number | null;
  status: 'active' | 'closed';
  created_at: string;
}

export interface SurveyResponseRow {
  id: number;
  survey_id: number;
  member_id: number;
  option_index: number;
  home_thana_id: number | null;
  home_union_id: number | null;
  created_at: string;
}

const SADAR = { division_id: 8, district_id: 1, upazila_id: 1, thana_id: 1 } as const;
const DHAKA_SAVAR = { division_id: 1, district_id: 5, upazila_id: 14, thana_id: null, union_id: null } as const;
const DHAKA_KERANIGANJ = { division_id: 1, district_id: 5, upazila_id: 15, thana_id: null, union_id: null } as const;
const CTG_PATIYA = { division_id: 2, district_id: 6, upazila_id: 17, thana_id: null, union_id: null } as const;

function loc(prefix: 'home' | 'current', v: { division_id: number | null; district_id: number | null; upazila_id: number | null; thana_id: number | null; union_id: number | null }) {
  return {
    [`${prefix}_division_id`]: v.division_id,
    [`${prefix}_district_id`]: v.district_id,
    [`${prefix}_upazila_id`]: v.upazila_id,
    [`${prefix}_thana_id`]: v.thana_id,
    [`${prefix}_union_id`]: v.union_id,
  };
}

function member(
  id: number,
  name: string,
  phone: string,
  homeUnion: number | null,
  current: typeof SADAR | typeof DHAKA_SAVAR | typeof DHAKA_KERANIGANJ | typeof CTG_PATIYA | 'home' | { division_id: number; district_id: number; upazila_id: number; thana_id: null; union_id: null },
  is_visible = true,
  homeUpazila?: number
): MemberRow {
  const home = homeUpazila
    ? { division_id: 8, district_id: 1, upazila_id: homeUpazila, thana_id: null, union_id: null }
    : { ...SADAR, union_id: homeUnion };
  const cur =
    current === 'home'
      ? home
      : { ...current, union_id: 'union_id' in current ? current.union_id : null };
  const ts = '2026-10-21T00:00:00.000Z';
  return {
    id,
    name,
    phone,
    email: null,
    phone_verified: false,
    email_verified: false,
    account_status: 'unverified',
    points: 0,
    badges: [],
    last_active_at: null,
    show_on_leaderboard: true,
    ...(loc('home', home) as object),
    ...(loc('current', cur) as object),
    is_visible,
    created_at: ts,
    updated_at: ts,
  } as unknown as MemberRow;
}

export const seedMembers: MemberRow[] = [
  member(1, 'মোঃ আরিফুল ইসলাম', '01711000001', 7, 'home'),
  member(2, 'মোঃ সাকিব হাসান', '01711000002', 8, 'home'),
  member(3, 'মোছাঃ শারমিন আক্তার', '01711000003', 10, 'home'),
  member(4, 'মোঃ রাকিবুল হাসান', '01711000004', 3, DHAKA_SAVAR),
  member(5, 'মোঃ তানভীর আহমেদ', '01711000005', 12, DHAKA_KERANIGANJ),
  member(6, 'মোছাঃ ফারজানা খাতুন', '01711000006', 1, CTG_PATIYA),
  member(7, 'মোঃ ইমরান হোসেন', '01711000007', 5, { division_id: 8, district_id: 1, upazila_id: 13, thana_id: null, union_id: null }),
  member(8, 'মোঃ নাহিদ হাসান', '01711000008', 9, { division_id: 8, district_id: 1, upazila_id: 2, thana_id: null, union_id: null }),
  member(9, 'মোছাঃ রুমানা পারভীন', '01711000009', 2, 'home'),
  member(10, 'মোঃ হাসান আলী', '01711000010', 11, 'home', false),
  member(11, 'মোঃ শরিফুল ইসলাম', '01711000011', null, 'home', true, 2),
  member(12, 'মোঃ কামরুল হাসান', '01711000012', 6, DHAKA_SAVAR),
];

export const seedSurveys: SurveyRow[] = [
  {
    id: 1,
    question: 'আপনার এলাকায় সবচেয়ে বড় সমস্যা কোনটি?',
    options: ['রাস্তাঘাটের বেহাল অবস্থা', 'পানি ও স্যানিটেশন', 'যানজট', 'মাদক ও অপরাধ', 'বিদ্যুৎ সমস্যা'],
    target_level: 'upazila',
    target_id: 1,
    status: 'active',
    created_at: '2026-10-21T00:00:00.000Z',
  },
  {
    id: 2,
    question: 'সারাদেশে কোন সেবাটি সবচেয়ে বেশি উন্নত করা জরুরি?',
    options: ['স্বাস্থ্যসেবা', 'শিক্ষা', 'পরিবহন ব্যবস্থা', 'ইন্টারনেট সেবা'],
    target_level: 'all',
    target_id: null,
    status: 'active',
    created_at: '2026-10-21T00:00:00.000Z',
  },
];

const UNION_OF: Record<number, number | null> = {
  1: 7, 2: 8, 3: 10, 4: 3, 5: 12, 6: 1, 7: 5, 8: 9, 9: 2, 10: 11, 11: null, 12: 6,
};

function resp(id: number, survey_id: number, member_id: number, option_index: number): SurveyResponseRow {
  const isSadar = member_id !== 11;
  return {
    id,
    survey_id,
    member_id,
    option_index,
    home_thana_id: isSadar ? 1 : null,
    home_union_id: UNION_OF[member_id] ?? null,
    created_at: '2026-10-21T00:00:00.000Z',
  };
}

export const seedResponses: SurveyResponseRow[] = [
  // Survey 1 — ময়মনসিংহ সদর members
  resp(1, 1, 1, 0), resp(2, 1, 2, 0), resp(3, 1, 3, 1), resp(4, 1, 4, 0), resp(5, 1, 5, 2),
  resp(6, 1, 6, 3), resp(7, 1, 7, 0), resp(8, 1, 8, 4), resp(9, 1, 9, 1), resp(10, 1, 12, 0),
  // Survey 2 — সারা দেশ
  resp(11, 2, 1, 0), resp(12, 2, 2, 1), resp(13, 2, 3, 0), resp(14, 2, 4, 2), resp(15, 2, 5, 0),
  resp(16, 2, 7, 3), resp(17, 2, 9, 1), resp(18, 2, 11, 0), resp(19, 2, 12, 2),
];

/* ---------- In-memory demo store (survives module reloads via globalThis) ---------- */

export interface DemoDb {
  members: MemberRow[];
  surveys: SurveyRow[];
  responses: SurveyResponseRow[];
  nextMemberId: number;
  nextSurveyId: number;
  nextResponseId: number;
}

const g = globalThis as unknown as { __jkDemoDb?: DemoDb };

export function demoDb(): DemoDb {
  if (!g.__jkDemoDb) {
    const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    g.__jkDemoDb = {
      members: clone(seedMembers),
      surveys: clone(seedSurveys),
      responses: clone(seedResponses),
      nextMemberId: seedMembers.length + 1,
      nextSurveyId: seedSurveys.length + 1,
      nextResponseId: seedResponses.length + 1,
    };
  }
  return g.__jkDemoDb;
}
