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
import type { Report, ReportStatus } from './types';

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

export function getReports() {
  return fetchTable<Report>('reports', mockReports, { col: 'created_at', asc: false });
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
}): Promise<Report> {
  const supa = getSupabase();
  const row = {
    ...input,
    status: 'pending' as ReportStatus,
    distance_m: null,
    created_at: new Date().toISOString(),
    time_ago: 'এইমাত্র',
  };
  if (!supa) {
    return { id: Date.now(), ...row } as Report;
  }
  const { data, error } = await supa.from('reports').insert(row).select().single();
  if (error || !data) throw new Error('রিপোর্ট সংরক্ষণ করা যায়নি');
  return data as Report;
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
