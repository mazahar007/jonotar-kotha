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
