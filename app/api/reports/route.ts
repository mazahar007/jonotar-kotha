import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { createReport, getCategories } from '@/lib/store';
import { getReports } from '@/lib/store';

export async function GET() {
  return ok(await getReports());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  if (!title || !description) return err('শিরোনাম ও বর্ণনা আবশ্যক');
  const cats = await getCategories();
  const match = cats.find((c) => c.name === body.category);
  const numOrNull = (v: unknown) => {
    const n = Number(v);
    return v != null && v !== '' && !Number.isNaN(n) ? n : null;
  };
  try {
    const row = await createReport({
      title,
      description,
      category: String(body.category || ''),
      category_id: match ? match.id : null,
      location_name: String(body.location_name || ''),
      is_anonymous: Boolean(body.is_anonymous),
      evidence_url: body.evidence_url ? String(body.evidence_url) : null,
      division_id: numOrNull(body.division_id),
      district_id: numOrNull(body.district_id),
      upazila_id: numOrNull(body.upazila_id),
      thana_id: numOrNull(body.thana_id),
      union_id: numOrNull(body.union_id),
      media_urls: Array.isArray(body.media_urls)
        ? body.media_urls.filter((u: unknown) => typeof u === 'string').slice(0, 4)
        : [],
    });
    return ok(row, 201);
  } catch {
    return err('রিপোর্ট সংরক্ষণ করা যায়নি');
  }
}

