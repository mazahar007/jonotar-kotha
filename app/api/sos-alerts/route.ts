import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import { createSosAlert } from '@/lib/store';
import { getSosAlerts } from '@/lib/store';

export async function GET() {
  return ok(await getSosAlerts());
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const row = await createSosAlert({
      alert_type: String(body.alert_type || 'emergency'),
      location: String(body.location || ''),
    });
    return ok(row, 201);
  } catch {
    return err('এলার্ট সংরক্ষণ করা যায়নি');
  }
}

