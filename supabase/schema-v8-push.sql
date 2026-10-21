-- জনতার কথা — Phase 8 migration: web push subscriptions + in-app notifications
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql AND schema-v7-comments.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - push_subscriptions — VAPID web-push subscriptions (one row per device).
--    endpoint is UNIQUE so re-subscribing the same browser upserts instead of
--    duplicating. member_id is optional (public app is login-free). The area
--    scope columns are nullable — reserved for area-targeted broadcasts
--    (Phase 9 emergency broadcast will use them).
--  - notifications — the in-app notification center. Every broadcast is ALSO
--    recorded here, so the bell + /notifications page work even when no
--    VAPID keys are configured (demo fallback) or a device is offline.
--
-- RLS: enabled with NO public policies — every read/write goes through the
-- service-role API routes (lib/push.ts), which return sanitized payloads.

create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  member_id int references members(id) on delete set null,
  division_id int null,
  district_id int null,
  upazila_id int null,
  thana_id int null,
  union_id int null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  url text null,
  kind text not null default 'info',
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
alter table notifications enable row level security;

create index if not exists idx_push_subscriptions_member
  on push_subscriptions (member_id);
create index if not exists idx_notifications_created
  on notifications (created_at desc);
