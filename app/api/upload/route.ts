import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

const MAX_FILES = 4;
const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO = 50 * 1024 * 1024; // 50MB

/**
 * POST /api/upload — multipart photo/video upload for reports.
 * Files go to the public Supabase Storage bucket `media` (service role).
 * Demo mode (no Supabase env): returns { demo: true, urls: [] } so the
 * client falls back to local object-URL previews — never crashes.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return err('ফাইল পাওয়া যায়নি');
  const files = form
    .getAll('files')
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_FILES);
  if (files.length === 0) return err('ফাইল পাওয়া যায়নি');

  for (const f of files) {
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (!isImage && !isVideo) return err('শুধু ছবি বা ভিডিও আপলোড করা যাবে');
    if (isImage && f.size > MAX_IMAGE) return err('ছবি সর্বোচ্চ ১০MB হতে পারবে');
    if (isVideo && f.size > MAX_VIDEO) return err('ভিডিও সর্বোচ্চ ৫০MB হতে পারবে');
  }

  const supa = getSupabase();
  if (!supa) return ok({ demo: true, urls: [] as string[] });

  const urls: string[] = [];
  for (const f of files) {
    const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `reports/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const buffer = Buffer.from(await f.arrayBuffer());
    const { error } = await supa.storage
      .from('media')
      .upload(path, buffer, { contentType: f.type, upsert: false });
    if (error) return err('আপলোড করা যায়নি');
    const { data } = supa.storage.from('media').getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return ok({ demo: false, urls });
}
