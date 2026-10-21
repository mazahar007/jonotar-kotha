import type { Report, Road, RoadStatus } from './types';

/**
 * Phase 10 — এলাকার সেফটি স্কোর (Area Safety Score) scoring engine.
 *
 * NO new tables: the score is computed on demand from existing data —
 * reports (last 90 days), current road/spot statuses, and report
 * verifications ("আমিও দেখেছি" counts).
 *
 * ----------------------------- FORMULA ----------------------------------
 * score starts at SCORE_BASE (100), then:
 *   − WEIGHT_SERIOUS    per serious report  (অপরাধ/দুর্ঘটনা জাতীয় ক্যাটাগরি)
 *   − WEIGHT_MEDIUM     per medium report   (দুর্নীতি, সড়ক-যানজট ইত্যাদি)
 *   − WEIGHT_MINOR      per minor report    (সামাজিক, রক্ত ইত্যাদি)
 *   − BAD_ROAD_PENALTY  per road/spot whose CURRENT status is bad
 *                       (ভাঙা/ঝুঁকিপূর্ণ = 'bad', বন্ধ = 'closed')
 *   + RESOLVED_BONUS    per report that is both community-verified
 *                       (verify_count ≥ VERIFIED_THRESHOLD) and resolved
 *                       (status === 'resolved') — shows the area is fixing things
 * Only reports created within the last LOOKBACK_DAYS count.
 * Final score is clamped to [SCORE_MIN, SCORE_MAX] = [0, 100].
 *
 * The exported constants below are the ONLY tuning knobs — everything else
 * in this file derives from them.
 * ---------------------------------------------------------------------------
 */

export const SCORE_BASE = 100;
export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const LOOKBACK_DAYS = 90;
export const WEIGHT_SERIOUS = 8;
export const WEIGHT_MEDIUM = 4;
export const WEIGHT_MINOR = 2;
export const BAD_ROAD_PENALTY = 3;
export const RESOLVED_BONUS = 2;
export const VERIFIED_THRESHOLD = 3;

export type Severity = 'serious' | 'medium' | 'minor';
export type Grade = 'safe' | 'caution' | 'risk';

/** Required honest disclaimer shown everywhere the score is displayed. */
export const SCORE_DISCLAIMER = 'এটি ব্যবহারকারীদের রিপোর্টের ভিত্তিতে আনুমানিক স্কোর';

/** Categories treated as serious (অপরাধ/দুর্ঘটনা জাতীয়). */
const SERIOUS_CATEGORIES = new Set(['নিরাপত্তা', 'নারী নিরাপত্তা', 'দুর্যোগ', 'বন্যা']);
/** Categories treated as medium weight. */
const MEDIUM_CATEGORIES = new Set(['দুর্নীতি', 'সড়ক ও যানজট', 'ভ্রমণ সহায়তা', 'স্বাস্থ্য']);
/** Everything else (সামাজিক, রক্ত, সব, unknown) counts as minor. */

export function severityOf(category: string): Severity {
  if (SERIOUS_CATEGORIES.has(category)) return 'serious';
  if (MEDIUM_CATEGORIES.has(category)) return 'medium';
  return 'minor';
}

/** Current road/spot statuses that count as "খারাপ/বন্ধ" for the penalty. */
export const BAD_ROAD_STATUSES: ReadonlySet<RoadStatus> = new Set<RoadStatus>(['bad', 'closed']);

export const GRADE_META: Record<Grade, { label: string; color: string; ring: string }> = {
  safe: { label: 'নিরাপদ', color: 'text-emerald-700', ring: '#10b981' },
  caution: { label: 'সতর্ক', color: 'text-amber-700', ring: '#f59e0b' },
  risk: { label: 'ঝুঁকিপূর্ণ', color: 'text-red-700', ring: '#ef4444' },
};

export function gradeOf(score: number): Grade {
  if (score >= 80) return 'safe';
  if (score >= 50) return 'caution';
  return 'risk';
}

export interface SafetyBreakdown {
  serious_reports: number;
  medium_reports: number;
  minor_reports: number;
  bad_roads: number;
  resolved_verified: number;
  total_reports: number;
  roads_checked: number;
  /** Trend vs the previous 90-day window: 'up' (better), 'down' (worse), 'same', or 'none' (no older data). */
  trend: 'up' | 'down' | 'same' | 'none';
}

export interface SafetyScore {
  score: number;
  grade: Grade;
  breakdown: SafetyBreakdown;
  computed_at: string;
}

/** Weight applied to one report of the given severity. */
function weightOf(severity: Severity): number {
  return severity === 'serious' ? WEIGHT_SERIOUS : severity === 'medium' ? WEIGHT_MEDIUM : WEIGHT_MINOR;
}

/** Raw (unclamped) score from in-window reports + roads. Shared by score and trend calc. */
function rawScore(reports: Report[], roads: Road[], verifyCounts: Record<number, number>): {
  raw: number;
  serious: number;
  medium: number;
  minor: number;
  badRoads: number;
  resolvedVerified: number;
} {
  let raw = SCORE_BASE;
  let serious = 0;
  let medium = 0;
  let minor = 0;

  for (const r of reports) {
    const sev = severityOf(r.category);
    raw -= weightOf(sev);
    if (sev === 'serious') serious++;
    else if (sev === 'medium') medium++;
    else minor++;

    // Community-verified AND resolved: the area fixed a real problem → bonus.
    if (r.status === 'resolved' && (verifyCounts[r.id] ?? 0) >= VERIFIED_THRESHOLD) {
      raw += RESOLVED_BONUS;
    }
  }
  // Penalty counted once per road/spot (bad roads resolved later → no deduction).
  const resolvedVerified = reports.filter(
    (r) => r.status === 'resolved' && (verifyCounts[r.id] ?? 0) >= VERIFIED_THRESHOLD
  ).length;

  let badRoads = 0;
  for (const road of roads) {
    if (road.current_status && BAD_ROAD_STATUSES.has(road.current_status)) {
      raw -= BAD_ROAD_PENALTY;
      badRoads++;
    }
  }
  return { raw, serious, medium, minor, badRoads, resolvedVerified };
}

/**
 * Compute the safety score for an area.
 * @param reports reports inside the scoring window (already area+time filtered)
 * @param roads   roads/spots for the area, each carrying its current status
 * @param verifyCounts map of report_id → "আমিও দেখেছি" count
 * @param olderReports optional reports from the PREVIOUS 90-day window for the trend hint
 */
export function computeSafetyScore(
  reports: Report[],
  roads: Road[],
  verifyCounts: Record<number, number>,
  olderReports: Report[] = []
): SafetyScore {
  const parts = rawScore(reports, roads, verifyCounts);
  const score = Math.min(SCORE_MAX, Math.max(SCORE_MIN, parts.raw));

  let trend: SafetyBreakdown['trend'] = 'none';
  if (olderReports.length > 0) {
    const prev = rawScore(olderReports, roads, verifyCounts);
    const prevScore = Math.min(SCORE_MAX, Math.max(SCORE_MIN, prev.raw));
    trend = score > prevScore ? 'up' : score < prevScore ? 'down' : 'same';
  }

  return {
    score,
    grade: gradeOf(score),
    breakdown: {
      serious_reports: parts.serious,
      medium_reports: parts.medium,
      minor_reports: parts.minor,
      bad_roads: parts.badRoads,
      resolved_verified: parts.resolvedVerified,
      total_reports: reports.length,
      roads_checked: roads.length,
      trend,
    },
    computed_at: new Date().toISOString(),
  };
}

/** Millisecond timestamp LOOKBACK_DAYS ago. */
export function lookbackStart(now = Date.now()): number {
  return now - LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
}
