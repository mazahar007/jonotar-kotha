import { getSupabase } from './supabase';
import {
  mockAreaRatings,
  mockBloodDonors,
  mockCategories,
  mockEvidence,
  mockFamily,
  mockGuides,
  mockMapIncidents,
  mockMunicipalityUpdates,
  mockReports,
  mockShelters,
  mockSosAlerts,
  mockVolunteers,
} from './mock';
import {
  fallbackDistricts,
  fallbackDivisions,
  fallbackThanas,
  fallbackUnions,
  fallbackUpazilas,
} from './locations';
import type { District, Division, Report, ReportStatus, Thana, UnionParishad, Upazila } from './types';

/** Data-access layer: tries Supabase, falls back to hardcoded mock data. */

async function fetchTable<T>(table: string, fallback: T[], orderBy?: { col: string; asc?: boolean }): Promise<T[]> {
  const supa = getSupabase();
  if (!supa) return fallback;
  try {
    let q = supa.from(table).select('*');
    if (orderBy) q = q.order(orderBy.col, { ascending: orderBy.asc ?? true });
    const { data, error } = await q;
    if (error || !data) return fallback;
    return data as T[];
  } catch {
    return fallback;
  }
}

export function getCategories() {
  return fetchTable('categories', mockCategories, { col: 'sort_order' });
}

export async function getReports(): Promise<Report[]> {
  const reports = await fetchTable<Report>('reports', mockReports, { col: 'created_at', asc: false });
  return attachLocationNames(reports);
}

/* ---------- Location hierarchy (Phase 2) ---------- */

export function getDivisions(): Promise<Division[]> {
  return fetchTable('divisions', fallbackDivisions, { col: 'sort_order' });
}

export async function getDistricts(divisionId?: number): Promise<District[]> {
  const all = await fetchTable('districts', fallbackDistricts, { col: 'sort_order' });
  return divisionId ? all.filter((d) => d.division_id === divisionId) : all;
}

export async function getUpazilas(districtId?: number): Promise<Upazila[]> {
  const all = await fetchTable('upazilas', fallbackUpazilas, { col: 'sort_order' });
  return districtId ? all.filter((u) => u.district_id === districtId) : all;
}

export async function getThanas(upazilaId?: number): Promise<Thana[]> {
  const all = await fetchTable('thanas', fallbackThanas, { col: 'sort_order' });
  return upazilaId ? all.filter((t) => t.upazila_id === upazilaId) : all;
}

export async function getUnions(upazilaId?: number): Promise<UnionParishad[]> {
  const all = await fetchTable('unions', fallbackUnions, { col: 'sort_order' });
  return upazilaId ? all.filter((u) => u.upazila_id === upazilaId) : all;
}

/** Resolve union/upazila/district names for reports that carry hierarchy IDs. */
async function attachLocationNames(reports: Report[]): Promise<Report[]> {
  const needs = reports.some((r) => r.union_id || r.upazila_id || r.district_id);
  if (!needs) return reports;
  const [unions, upazilas, districts] = await Promise.all([getUnions(), getUpazilas(), getDistricts()]);
  const unionName = new Map(unions.map((u) => [u.id, u.name_bn]));
  const upazilaName = new Map(upazilas.map((u) => [u.id, u.name_bn]));
  const districtName = new Map(districts.map((d) => [d.id, d.name_bn]));
  return reports.map((r) => ({
    ...r,
    union_name: r.union_id ? unionName.get(r.union_id) ?? null : null,
    upazila_name: r.upazila_id ? upazilaName.get(r.upazila_id) ?? null : null,
    district_name: r.district_id ? districtName.get(r.district_id) ?? null : null,
  }));
}

export function getVolunteers() {
  return fetchTable('volunteers', mockVolunteers, { col: 'sort_order' });
}

export function getBloodDonors() {
  return fetchTable('blood_donors', mockBloodDonors);
}

export function getSosAlerts() {
  return fetchTable('sos_alerts', mockSosAlerts, { col: 'created_at', asc: false });
}

export function getEvidence() {
  return fetchTable('evidence_items', mockEvidence, { col: 'created_at', asc: false });
}

export function getFamily() {
  return fetchTable('family_members', mockFamily, { col: 'sort_order' });
}

export function getGuides() {
  return fetchTable('guides', mockGuides);
}

export function getShelters() {
  return fetchTable('shelters', mockShelters);
}

export function getMapIncidents() {
  return fetchTable('map_incidents', mockMapIncidents);
}

export function getAreaRatings() {
  return fetchTable('area_ratings', mockAreaRatings);
}

export function getMunicipalityUpdates() {
  return fetchTable('municipality_updates', mockMunicipalityUpdates, { col: 'created_at', asc: false });
}

export async function createReport(input: {
  title: string;
  description: string;
  category: string;
  category_id: number | null;
  location_name: string;
  is_anonymous: boolean;
  evidence_url: string | null;
  division_id?: number | null;
  district_id?: number | null;
  upazila_id?: number | null;
  thana_id?: number | null;
  union_id?: number | null;
  media_urls?: string[];
}): Promise<Report> {
  const supa = getSupabase();
  const row = {
    ...input,
    media_urls: input.media_urls ?? [],
    status: 'pending' as ReportStatus,
    distance_m: null,
    created_at: new Date().toISOString(),
    time_ago: 'এইমাত্র',
  };
  if (!supa) {
    return { id: Date.now(), ...row } as Report;
  }
  const { data, error } = await supa.from('reports').insert(row).select().single();
  if (!error && data) return data as Report;
  // If schema-v2 has not been run yet, the new columns don't exist —
  // retry with the Phase-1 fields so reporting never breaks.
  const base = { ...row } as Record<string, unknown>;
  for (const k of ['division_id', 'district_id', 'upazila_id', 'thana_id', 'union_id', 'media_urls']) {
    delete base[k];
  }
  const retry = await supa.from('reports').insert(base).select().single();
  if (retry.error || !retry.data) throw new Error('রিপোর্ট সংরক্ষণ করা যায়নি');
  return retry.data as Report;
}

export async function createSosAlert(input: { alert_type: string; location: string }) {
  const supa = getSupabase();
  const row = { ...input, status: 'sent', created_at: new Date().toISOString() };
  if (!supa) return { id: Date.now(), ...row };
  const { data, error } = await supa.from('sos_alerts').insert(row).select().single();
  if (error || !data) throw new Error('এলার্ট সংরক্ষণ করা যায়নি');
  return data;
}

export async function voteAreaRating(id: number): Promise<void> {
  const supa = getSupabase();
  if (!supa) return;
  const { data } = await supa.from('area_ratings').select('votes').eq('id', id).single();
  if (!data) return;
  await supa.from('area_ratings').update({ votes: (data.votes ?? 0) + 1 }).eq('id', id);
}
