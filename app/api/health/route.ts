import { ok } from '@/lib/api';
import { isConfigured } from '@/lib/supabase';

export async function GET() {
  return ok({ ok: true, supabase: isConfigured(), app: 'jonotar-kotha' });
}
