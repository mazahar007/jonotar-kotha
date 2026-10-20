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
