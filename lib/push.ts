import webPush from 'web-push';
import { getSupabase } from './supabase';
import { timeAgoBn } from './time';

/**
 * Phase 8 data layer: web-push subscriptions + in-app notification center.
 * Supabase first (service role); ANY failure (including schema-v8 not yet
 * run) falls back to the in-memory demo store so the app never 500s.
 *
 * Broadcast rule (honest, never fake):
 * - Every broadcast is ALWAYS recorded in the in-app center.
 * - When VAPID keys are configured, web-push is attempted for every
 *   subscription (dead endpoints 410/404 are pruned) → delivered: 'push'.
 * - When VAPID keys are absent → delivered: 'inapp', reason 'no-vapid-keys'.
 */

export interface PushSubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
  member_id: number | null;
  division_id: number | null;
  district_id: number | null;
  upazila_id: number | null;
  thana_id: number | null;
  union_id: number | null;
  created_at: string;
}

export interface NotificationRow {
  id: number;
  title: string;
  body: string;
  url: string | null;
  kind: string;
  /** Phase 18 — targeted recipient (null = global, visible to everyone). */
  member_id: number | null;
  created_at: string;
}

export interface Notification extends NotificationRow {
  time_ago: string;
}

/* ---------- demo fallback (survives module reloads via globalThis) ---------- */

const HOUR = 3_600_000;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const seedNotifications: NotificationRow[] = [
  {
    id: 1,
    title: 'এলাকার নতুন জরিপে মতামত দিন',
    body: 'ময়মনসিংহ সদরের রাস্তার অবস্থা নিয়ে জরিপ চলছে — আপনার মতামত দিন।',
    url: '/surveys',
    kind: 'info',
    member_id: null,
    created_at: ago(5 * HOUR),
  },
  {
    id: 2,
    title: 'জনতার কথায় স্বাগতম',
    body: 'জরুরি খবর, রোড আপডেট আর জরিপের নোটিফিকেশন এখানে দেখতে পাবেন। প্রোফাইল থেকে পুশ নোটিফিকেশন চালু করুন।',
    url: '/profile',
    kind: 'welcome',
    member_id: null,
    created_at: ago(26 * HOUR),
  },
];

interface PushDemoDb {
  subscriptions: PushSubscriptionRow[];
  notifications: NotificationRow[];
  nextSubId: number;
  nextNotifId: number;
}

const g = globalThis as unknown as { __jkPushDb?: PushDemoDb };

export function pushDemoDb(): PushDemoDb {
  if (!g.__jkPushDb) {
    const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
    g.__jkPushDb = {
      subscriptions: [],
      notifications: clone(seedNotifications),
      nextSubId: 1,
      nextNotifId: seedNotifications.length + 1,
    };
  }
  return g.__jkPushDb;
}

/* ---------- VAPID ---------- */

/** True only when the full VAPID keypair is configured (Vercel env vars). */
export function vapidConfigured(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPush(): boolean {
  if (!vapidConfigured()) return false;
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  return true;
}

/* ---------- subscriptions ---------- */

export interface SubscriptionInput {
  endpoint: string;
  p256dh: string;
  auth: string;
  member_id?: number | null;
}

export async function saveSubscription(input: SubscriptionInput): Promise<void> {
  const row = {
    endpoint: input.endpoint,
    p256dh: input.p256dh,
    auth: input.auth,
    member_id: input.member_id ?? null,
    division_id: null,
    district_id: null,
    upazila_id: null,
    thana_id: null,
    union_id: null,
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa
        .from('push_subscriptions')
        .upsert(row, { onConflict: 'endpoint' });
      if (!error) return;
    } catch {
      /* fall through to demo */
    }
  }
  const db = pushDemoDb();
  const existing = db.subscriptions.find((s) => s.endpoint === input.endpoint);
  if (existing) {
    existing.p256dh = input.p256dh;
    existing.auth = input.auth;
    existing.member_id = input.member_id ?? null;
  } else {
    db.subscriptions.push({ id: db.nextSubId++, ...row, created_at: new Date().toISOString() });
  }
}

export async function removeSubscription(endpoint: string): Promise<void> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { error } = await supa.from('push_subscriptions').delete().eq('endpoint', endpoint);
      if (!error) return;
    } catch {
      /* fall through to demo */
    }
  }
  const db = pushDemoDb();
  db.subscriptions = db.subscriptions.filter((s) => s.endpoint !== endpoint);
}

export async function getSubscriptions(): Promise<PushSubscriptionRow[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      const { data, error } = await supa
        .from('push_subscriptions')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) return data as PushSubscriptionRow[];
    } catch {
      /* fall through to demo */
    }
  }
  return [...pushDemoDb().subscriptions];
}

/* ---------- in-app notifications ---------- */

function toNotification(r: NotificationRow): Notification {
  return { ...r, time_ago: timeAgoBn(r.created_at) };
}

export async function createNotification(input: {
  title: string;
  body: string;
  url?: string | null;
  kind?: string;
  /** Phase 18 — target a single member (null = global notification). */
  member_id?: number | null;
}): Promise<Notification> {
  const row = {
    title: input.title,
    body: input.body,
    url: input.url ?? null,
    kind: input.kind ?? 'info',
    member_id: input.member_id ?? null,
    created_at: new Date().toISOString(),
  };
  const supa = getSupabase();
  if (supa) {
    try {
      const inserted = await insertNotificationRow(supa, row);
      if (inserted) return toNotification(inserted as unknown as NotificationRow);
    } catch {
      /* fall through to demo */
    }
  }
  const db = pushDemoDb();
  const demoRow: NotificationRow = { id: db.nextNotifId++, ...row };
  db.notifications.push(demoRow);
  return toNotification(demoRow);
}

/**
 * Insert a notification row. Phase 18 adds `member_id`; if the Supabase
 * schema hasn't been migrated yet, retry without it so the notification
 * still persists instead of falling back to the in-memory demo store.
 */
async function insertNotificationRow(
  supa: NonNullable<ReturnType<typeof getSupabase>>,
  row: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const attempt = async (r: Record<string, unknown>) => {
    const { data, error } = await supa.from('notifications').insert(r).select().single();
    if (error) throw error;
    return data as Record<string, unknown>;
  };
  try {
    return await attempt(row);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/member_id/.test(msg) && /column|does not exist/i.test(msg)) {
      const { member_id: _m, ...legacy } = row;
      try {
        return await attempt(legacy);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function getNotifications(
  limit = 30,
  /** Phase 18 — when set, include notifications targeted to this member. */
  memberId?: number | null
): Promise<Notification[]> {
  const supa = getSupabase();
  if (supa) {
    try {
      let q = supa.from('notifications').select('*').order('created_at', { ascending: false }).limit(limit);
      if (memberId != null) {
        // Global (member_id null) + own. Pre-v18 schemas lack the column —
        // the query fails and we fall through to the demo store.
        q = q.or(`member_id.is.null,member_id.eq.${memberId}`);
      } else {
        q = q.is('member_id', null);
      }
      const { data, error } = await q;
      if (!error && data) return (data as NotificationRow[]).map(toNotification);
      // Pre-v18 fallback: plain global feed.
      if (memberId != null) {
        const retry = await supa
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!retry.error && retry.data)
          return (retry.data as NotificationRow[]).map(toNotification);
      }
    } catch {
      /* fall through to demo */
    }
  }
  return [...pushDemoDb().notifications]
    .filter((n) => n.member_id == null || n.member_id === memberId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit)
    .map(toNotification);
}

/* ---------- broadcast ---------- */

export interface BroadcastResult {
  delivered: 'push' | 'inapp';
  reason?: string;
  pushSent: number;
  pushFailed: number;
  pruned: number;
  inappId: number;
}

export interface BroadcastScope {
  division_id?: number | null;
  district_id?: number | null;
  upazila_id?: number | null;
  thana_id?: number | null;
}

export async function sendBroadcast(input: {
  title: string;
  body: string;
  url?: string | null;
  kind?: string;
  /** Phase 9 — area-targeted broadcast. Subscribers with no area scope
   *  receive everything; subscribers with a scope receive only broadcasts
   *  whose non-null scope levels match theirs. Omitted = all subscribers. */
  scope?: BroadcastScope | null;
}): Promise<BroadcastResult> {
  // Always record in the in-app center — the bell + /notifications page
  // show this even with no VAPID keys or offline devices.
  const notif = await createNotification(input);

  if (!configureWebPush()) {
    return {
      delivered: 'inapp',
      reason: 'no-vapid-keys',
      pushSent: 0,
      pushFailed: 0,
      pruned: 0,
      inappId: notif.id,
    };
  }

  const subs = (await getSubscriptions()).filter((s) => {
    const scope = input.scope;
    if (!scope) return true;
    // A null subscriber scope means "subscribed to everything".
    const pairs: [number | null | undefined, number | null][] = [
      [scope.division_id, s.division_id],
      [scope.district_id, s.district_id],
      [scope.upazila_id, s.upazila_id],
      [scope.thana_id, s.thana_id],
    ];
    return pairs.every(
      ([bScope, sScope]) => bScope == null || sScope == null || bScope === sScope
    );
  });
  const payload = JSON.stringify({ title: input.title, body: input.body, url: input.url ?? '/' });
  let pushSent = 0;
  let pushFailed = 0;
  let pruned = 0;
  for (const s of subs) {
    try {
      await webPush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      pushSent++;
    } catch (e) {
      pushFailed++;
      // Dead subscription (expired/uninstalled): prune it so future
      // broadcasts don't keep hitting a dead endpoint.
      const status = (e as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await removeSubscription(s.endpoint);
        pruned++;
      }
    }
  }
  return { delivered: 'push', pushSent, pushFailed, pruned, inappId: notif.id };
}
