import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;
let attempted = false;

/** Server-side Supabase client with the service-role key. Never expose to the browser. */
export function getSupabase(): SupabaseClient | null {
  if (attempted) return cached;
  attempted = true;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export function isConfigured(): boolean {
  return getSupabase() !== null;
}
