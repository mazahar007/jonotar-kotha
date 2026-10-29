import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSettings, updateSettings } from '@/lib/settings';

/**
 * Phase 21aj — site settings API.
 * GET  /api/settings — public (the homepage reads hero text + emergency
 *        numbers from here; DEFAULT_SETTINGS apply when unset).
 * PUT  /api/settings — admin only (middleware requires the admin session
 *        for all non-GET, non-citizen writes). Body = partial SiteSettings.
 */
export async function GET() {
  return ok(await getSettings());
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    return ok(await updateSettings(body));
  } catch {
    return err('সেটিংস সংরক্ষণ করা যায়নি');
  }
}
