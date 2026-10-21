import { NextRequest } from 'next/server';
import { err, ok } from '@/lib/api';
import {
  createLiveShare,
  listActiveShares,
  sanitizeBlood,
} from '@/lib/live-shares';
import { getSessionMemberRow } from '@/lib/member-session';
import { getMemberRowByPhone } from '@/lib/members-store';
import { createNotification } from '@/lib/push';
import { listContacts } from '@/lib/trusted-contacts';
import { BLOOD_GROUPS, LIVE_PURPOSES, type LiveSharePurpose } from '@/lib/types';

function validCoord(v: unknown, max: number): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= max;
}

/**
 * Public list — currently used by the /blood "লাইভ রক্তের প্রয়োজন" strip:
 * GET /api/live-shares?purpose=blood → active shares, minimal fields only.
 */
export async function GET(req: NextRequest) {
  const purpose = req.nextUrl.searchParams.get('purpose') as LiveSharePurpose | null;
  if (!purpose || !LIVE_PURPOSES.includes(purpose)) {
    return err('সঠিক purpose দিন (danger | blood | help | general)', 400);
  }
  const rows = await listActiveShares(purpose);
  return ok(rows.map(sanitizeBlood));
}

/** Create a live share session. Public citizen write (whitelisted in middleware). */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const purpose = String(body.purpose || '') as LiveSharePurpose;
  if (!LIVE_PURPOSES.includes(purpose)) return err('সঠিক উদ্দেশ্য বেছে নিন', 400);
  if (!validCoord(body.lat, 90) || !validCoord(body.lng, 180)) {
    return err('লোকেশন পাওয়া যায়নি — GPS চালু করে আবার চেষ্টা করুন', 400);
  }

  // Member session is optional — it links the share and prefills identity.
  const member = await getSessionMemberRow().catch(() => null);
  const name = String(body.name || member?.name || '').trim();
  if (!name) return err('আপনার নাম লিখুন', 400);
  const phoneRaw = String(body.phone || member?.phone || '').trim();
  const bloodGroup =
    purpose === 'blood' && BLOOD_GROUPS.includes(body.blood_group) ? String(body.blood_group) : null;

  try {
    const created = await createLiveShare({
      member_id: member?.id ?? null,
      sharer_name: name.slice(0, 80),
      phone: phoneRaw ? phoneRaw.slice(0, 20) : null,
      show_phone: body.show_phone === true,
      purpose,
      blood_group: bloodGroup,
      note: body.note ? String(body.note).trim().slice(0, 200) || null : null,
      lat: body.lat,
      lng: body.lng,
      accuracy: typeof body.accuracy === 'number' && Number.isFinite(body.accuracy) ? body.accuracy : null,
    });

    // Phase 11 (best-effort, never fails the share): if a trusted contact's
    // phone belongs to a registered member, record an SOS alert in the
    // Phase 8 in-app notification center. Documented limitation: the center
    // is a global feed (Phase 8 has no per-member targeting), so this alert
    // reaches the contact through the shared feed, not as a private ping.
    if (member) {
      try {
        const contacts = await listContacts(member.id);
        const link = `${process.env.NEXT_PUBLIC_APP_URL || ''}/live/${created.id}`;
        for (const c of contacts) {
          try {
            const row = await getMemberRowByPhone(c.phone);
            if (!row) continue; // contact is not a registered member
            await createNotification({
              title: '🆘 জরুরি SOS অ্যালার্ট',
              body: `${name} বিপদে আছেন — লাইভ লোকেশন: ${link || `/live/${created.id}`} — জনতার কথা`,
              url: `/live/${created.id}`,
              kind: 'sos',
            });
          } catch {
            /* best-effort — one contact's failure skips, never throws */
          }
        }
      } catch {
        /* best-effort — the share itself already succeeded */
      }
    }

    return ok({ ...created, url: `/live/${created.id}` }, 201);
  } catch {
    return err('শেয়ার শুরু করা যায়নি');
  }
}
