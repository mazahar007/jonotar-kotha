import { NextRequest } from 'next/server';
import { ok } from '@/lib/api';
import { getReports } from '@/lib/store';
import { getRoads } from '@/lib/roads-store';
import { getReportStats } from '@/lib/report-comments';
import {
  GRADE_META,
  SCORE_DISCLAIMER,
  computeSafetyScore,
  lookbackStart,
  type SafetyScore,
} from '@/lib/safety-score';
import type { LocationIds, Report, RoadKind } from '@/lib/types';

function numParam(req: NextRequest, key: string): number | null {
  const raw = req.nextUrl.searchParams.get(key);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

/**
 * A report belongs to the requested area when it has no stored hierarchy
 * (demo seed reports carry none — they count for every area) or when its
 * stored ids match every requested level.
 */
function inArea(r: Report, f: Partial<LocationIds>): boolean {
  if (f.division_id != null && r.division_id != null && r.division_id !== f.division_id) return false;
  if (f.district_id != null && r.district_id != null && r.district_id !== f.district_id) return false;
  if (f.upazila_id != null && r.upazila_id != null && r.upazila_id !== f.upazila_id) return false;
  if (f.thana_id != null && r.thana_id != null && r.thana_id !== f.thana_id) return false;
  if (f.union_id != null && r.union_id != null && r.union_id !== f.union_id) return false;
  return true;
}

export interface SafetyScoreResponse extends SafetyScore {
  grade_label: string;
  area: Partial<LocationIds>;
  disclaimer: string;
}

/** GET /api/safety-score?thana_id=…&union_id=… — public.
    0–100 area safety score from the last 90 days of reports + current
    road/spot statuses + verifications. Works fully in demo mode (Supabase
    optional, seed data is used when it's absent). */
export async function GET(req: NextRequest): Promise<Response> {
  const area: Partial<LocationIds> = {
    division_id: numParam(req, 'division_id'),
    district_id: numParam(req, 'district_id'),
    upazila_id: numParam(req, 'upazila_id'),
    thana_id: numParam(req, 'thana_id'),
    union_id: numParam(req, 'union_id'),
  };

  const [reports, roads] = await Promise.all([
    getReports(),
    getRoads({ ...area } as Partial<LocationIds> & { kind?: RoadKind }),
  ]);

  const now = Date.now();
  const windowStart = lookbackStart(now);
  const prevStart = windowStart - 90 * 24 * 60 * 60 * 1000;

  const inWindow: Report[] = [];
  const older: Report[] = [];
  for (const r of reports) {
    if (!inArea(r, area)) continue;
    const t = new Date(r.created_at).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= windowStart) inWindow.push(r);
    else if (t >= prevStart) older.push(r);
  }

  const verifyCounts: Record<number, number> = {};
  const stats = await getReportStats(inWindow.map((r) => r.id));
  for (const r of inWindow) verifyCounts[r.id] = stats[r.id]?.verify_count ?? 0;

  const result = computeSafetyScore(inWindow, roads, verifyCounts, older);

  const body: SafetyScoreResponse = {
    ...result,
    grade_label: GRADE_META[result.grade].label,
    area,
    disclaimer: SCORE_DISCLAIMER,
  };
  return ok(body);
}
