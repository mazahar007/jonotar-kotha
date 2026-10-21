export type ReportStatus = 'pending' | 'verified' | 'in_progress' | 'resolved' | 'urgent';

export interface Category {
  id: number;
  name: string;
  sort_order: number;
}

export interface Report {
  id: number;
  title: string;
  description: string;
  category: string;
  category_id: number | null;
  location_name: string;
  distance_m: number | null;
  is_anonymous: boolean;
  status: ReportStatus;
  evidence_url: string | null;
  created_at: string;
  time_ago: string;
  // Phase 2 — administrative location hierarchy + uploaded media
  division_id?: number | null;
  district_id?: number | null;
  upazila_id?: number | null;
  thana_id?: number | null;
  union_id?: number | null;
  media_urls?: string[];
  // Names resolved server-side for the breadcrumb (union, upazila, district)
  union_name?: string | null;
  upazila_name?: string | null;
  district_name?: string | null;
}

/* ---------- Bangladesh administrative hierarchy (Phase 2) ---------- */

export interface LocationNode {
  id: number;
  name_bn: string;
  name_en: string;
  slug: string;
  sort_order: number;
}

export interface Division extends LocationNode {}

export interface District extends LocationNode {
  division_id: number;
}

export interface Upazila extends LocationNode {
  district_id: number;
}

export interface Thana extends LocationNode {
  upazila_id: number;
}

export interface UnionParishad extends LocationNode {
  upazila_id: number;
}

export interface Volunteer {
  id: number;
  name: string;
  role: string;
  points: number;
  sort_order: number;
}

export interface BloodDonor {
  id: number;
  name: string;
  blood_group: string;
  phone_masked: string;
  is_active: boolean;
  distance_m: number | null;
}

export interface SosAlert {
  id: number;
  alert_type: string;
  location: string;
  status: string;
  created_at: string;
}

/* ---------- Live location shares (Phase 6) ---------- */

export type LiveSharePurpose = 'danger' | 'blood' | 'help' | 'general';

export const LIVE_PURPOSES: LiveSharePurpose[] = ['danger', 'blood', 'help', 'general'];

export const LIVE_PURPOSE_LABEL: Record<LiveSharePurpose, string> = {
  danger: 'বিপদে আছি',
  blood: 'রক্ত দরকার',
  help: 'সাহায্য দরকার',
  general: 'সাধারণ শেয়ার',
};

/** Big banner text shown to viewers of a live share. */
export const LIVE_PURPOSE_BANNER: Record<LiveSharePurpose, string> = {
  danger: 'বিপদে আছেন — সাহায্য প্রয়োজন',
  blood: 'রক্ত প্রয়োজন',
  help: 'সাহায্য প্রয়োজন',
  general: 'লাইভ লোকেশন শেয়ার করেছেন',
};

export const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'] as const;

/** Sanitized payload of GET /api/live-shares/[id] — never carries owner_token. */
export interface LiveSharePublic {
  id: string;
  sharer_name: string;
  purpose: LiveSharePurpose;
  blood_group: string | null;
  note: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  is_active: boolean;
  expired: boolean;
  expires_at: string;
  updated_at: string;
  /** Present ONLY when the sharer opted to show their number. */
  phone?: string;
}

/** Minimal card payload for the /blood live strip. */
export interface LiveBloodShare {
  id: string;
  sharer_name: string;
  blood_group: string | null;
  updated_at: string;
}

/** Admin SOS-inbox view of a live share (still no owner_token). */
export interface LiveShareAdmin {
  id: string;
  sharer_name: string;
  purpose: LiveSharePurpose;
  blood_group: string | null;
  note: string | null;
  lat: number;
  lng: number;
  accuracy: number | null;
  is_active: boolean;
  expired: boolean;
  expires_at: string;
  updated_at: string;
  /** Admin always sees the number when one was given. */
  phone: string | null;
  show_phone: boolean;
  member_id: number | null;
  created_at: string;
}

export interface EvidenceItem {
  id: number;
  title: string;
  media_url: string | null;
  encrypted: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: number;
  name: string;
  relation: string;
  status: string;
  location_name: string;
  is_live: boolean;
  sort_order: number;
}

export interface Guide {
  id: number;
  name: string;
  rating: number;
  distance_m: number | null;
  verified: boolean;
}

export interface Shelter {
  id: number;
  name: string;
  shelter_type: string;
  distance_m: number | null;
}

export interface MapIncident {
  id: number;
  kind: string;
  label: string;
  lat: number;
  lng: number;
}

export interface AreaRating {
  id: number;
  area: string;
  score: number;
  votes: number;
}

export interface MunicipalityUpdate {
  id: number;
  report_id: number | null;
  note: string;
  created_at: string;
}

/* ---------- Members, surveys (Phase 3) ---------- */

/** The 5 location IDs of one place (home or current). */
export interface LocationIds {
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  home: LocationIds;
  current: LocationIds;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

/** Member as shown to other members / the public — never includes phone. */
export interface PublicMember {
  id: number;
  name: string;
  home_breadcrumb: string;
  current_breadcrumb: string;
}

export type SurveyTargetLevel = 'all' | 'division' | 'district' | 'upazila' | 'thana' | 'union';

export interface Survey {
  id: number;
  question: string;
  options: string[];
  target_level: SurveyTargetLevel;
  target_id: number | null;
  target_label: string;
  status: 'active' | 'closed';
  created_at: string;
}

export interface SurveyResults {
  total: number;
  per_option: { option: string; count: number; pct: number }[];
}

/** Admin-only breakdown of responses by the voter's home থানা / ইউনিয়ন. */
export interface SurveyBreakdown {
  by_thana: { name: string; total: number; per_option: number[] }[];
  by_union: { name: string; total: number; per_option: number[] }[];
}

export interface SurveyWithState extends Survey {
  my_vote: number | null;
  in_scope: boolean | null; // null when the requester is not a member
  results: SurveyResults | null; // shown after voting / when closed / admin
  breakdown?: SurveyBreakdown;
}

export interface AmarElakaData {
  area_label: string;
  total: number;
  at_home: number;
  away: number;
  away_list: { id: number; name: string; current_breadcrumb: string }[];
  near_me: { id: number; name: string; current_breadcrumb: string }[];
  my_current_breadcrumb: string;
  i_am_away: boolean;
}

/* ---------- Roads (Phase 4) — area road conditions with live updates ---------- */
/* Phase 5 adds spot support (kind) and one-tap preset statuses.                */

export type RoadKind = 'road' | 'spot';

export type RoadStatus =
  | 'good'
  | 'fair'
  | 'bad'
  | 'repair'
  | 'traffic'
  | 'traffic_light'
  | 'waterlogged'
  | 'closed'
  | 'incident'
  | 'accident'
  | 'power_out'
  | 'power_back'
  | 'gas_out'
  | 'gas_back'
  | 'water_out'
  | 'water_back';

export const ROAD_STATUS_LABEL: Record<RoadStatus, string> = {
  good: 'ভালো',
  fair: 'মোটামুটি',
  bad: 'ভাঙা / ঝুঁকিপূর্ণ',
  repair: 'মেরামত চলছে',
  traffic: 'যানজট',
  traffic_light: 'হালকা জ্যাম',
  waterlogged: 'জলাবদ্ধ',
  closed: 'বন্ধ',
  incident: 'ঝামেলা চলতেছে',
  accident: 'দুর্ঘটনা',
  power_out: 'বিদ্যুৎ নাই',
  power_back: 'বিদ্যুৎ এসেছে',
  gas_out: 'গ্যাস নাই',
  gas_back: 'গ্যাস এসেছে',
  water_out: 'পানি নাই',
  water_back: 'পানি এসেছে',
};

export const ROAD_STATUS_OPTIONS: { value: RoadStatus; label: string }[] = [
  { value: 'good', label: 'ভালো' },
  { value: 'fair', label: 'মোটামুটি' },
  { value: 'bad', label: 'ভাঙা / ঝুঁকিপূর্ণ' },
  { value: 'repair', label: 'মেরামত চলছে' },
  { value: 'traffic', label: 'যানজট' },
  { value: 'traffic_light', label: 'হালকা জ্যাম' },
  { value: 'waterlogged', label: 'জলাবদ্ধ' },
  { value: 'closed', label: 'বন্ধ' },
  { value: 'incident', label: 'ঝামেলা চলতেছে' },
  { value: 'accident', label: 'দুর্ঘটনা' },
  { value: 'power_out', label: 'বিদ্যুৎ নাই' },
  { value: 'power_back', label: 'বিদ্যুৎ এসেছে' },
  { value: 'gas_out', label: 'গ্যাস নাই' },
  { value: 'gas_back', label: 'গ্যাস এসেছে' },
  { value: 'water_out', label: 'পানি নাই' },
  { value: 'water_back', label: 'পানি এসেছে' },
];

export const ROAD_STATUSES = ROAD_STATUS_OPTIONS.map((o) => o.value) as RoadStatus[];

export interface RoadUpdate {
  id: number;
  road_id: number;
  status: RoadStatus;
  note: string;
  media_url: string | null;
  reporter_name: string | null;
  /** Phase 5 — set when the update came from a one-tap preset chip. */
  preset_key: string | null;
  created_at: string;
  time_ago: string;
}

export interface Road {
  id: number;
  name: string;
  /** Phase 5 — 'road' = a road; 'spot' = an important place / মোড়. */
  kind: RoadKind;
  /** Phase 5 — এলাকার নাম for spots (e.g. "চরপাড়া"); optional. */
  locality_name: string | null;
  from_place: string | null;
  to_place: string | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
  created_at: string;
  /** Latest update's status; null when the road has no updates yet. */
  current_status: RoadStatus | null;
  latest_update: RoadUpdate | null;
  update_count: number;
  // Names resolved server-side for the breadcrumb (union, upazila, district)
  union_name?: string | null;
  upazila_name?: string | null;
  district_name?: string | null;
}

export interface RoadDetail extends Road {
  updates: RoadUpdate[];
}

export const STATUS_LABEL: Record<ReportStatus, string> = {
  pending: 'যাচাইয়ের জন্য যাবে',
  verified: 'যাচাইকৃত',
  in_progress: 'সমাধান চলছে',
  resolved: 'সমাধান হয়েছে',
  urgent: 'জরুরি',
};

export const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'pending', label: 'যাচাইয়ের জন্য যাবে' },
  { value: 'verified', label: 'যাচাইকৃত' },
  { value: 'in_progress', label: 'সমাধান চলছে' },
  { value: 'resolved', label: 'সমাধান হয়েছে' },
  { value: 'urgent', label: 'জরুরি' },
];
