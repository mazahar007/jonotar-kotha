-- জনতার কথা — Phase 15 migration: 🏆 পয়েন্ট, ব্যাজ, লাইক, রেটিং
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql, schema-v7-comments.sql, schema-v8-push.sql,
-- schema-v9-broadcasts.sql, schema-v11-contacts.sql AND schema-v13-auth.sql
-- (Supabase Dashboard → SQL Editor → paste → Run)
--
-- Adds:
--  - members.last_active_at (timestamptz, nullable) — Phase 13 already added
--    points + badges; Phase 15 needs the activity timestamp for the
--    inactivity penalty. Also adds members.show_on_leaderboard
--    (boolean, default true) — opt-in toggle for "শীর্ষ অবদানকারী".
--  - point_ledger — every point movement (earn +, penalty −). RLS enabled;
--    every read/write goes through the service-role API routes (lib/points.ts),
--    which enforce member identity via the member session (same pattern as
--    Phase 13 otp_codes — no public policies on purpose).
--  - likes — member likes on reports/comments, one per (member, target).
--  - ratings — member star ratings on roads/spots, one per (member, target);
--    re-rating updates stars, awards NO extra point.
--
-- পয়েন্ট নিয়ম (ডকুমেন্টেশন — lib/points.ts-এ একই নিয়ম):
--  - প্রতিটি কাজে +১: রিপোর্ট পোস্ট, মন্তব্য, লাইক, ভেরিফাই ভোট,
--    রেটিং, রোড আপডেট, জরিপে ভোট।
--  - একই (member, ref) দুবার পয়েন্ট পায় না (idempotent)।
--  - নিষ্ক্রিয়তা: কোনো লগ-ইন করা কাজের সময় last_active_at থেকে ৪৮ঘণ্টা+
--    পার হলে প্রতি ৪৮ঘণ্টায় ৫ পয়েন্ট কাটা (মোট শূন্যের নিচে নামে না);
--    প্রতিটি লগ-ইন করা কাজে last_active_at আপডেট হয়।
--  - ব্যাজ: প্রতি ১০০ পয়েন্টে একটি করে, ১০০০ পর্যন্ত।

-- ---- members: Phase 15 fields (points + badges came with schema-v13) ----
alter table members
  add column if not exists points integer not null default 0,
  add column if not exists badges text[] not null default '{}',
  add column if not exists last_active_at timestamptz,
  add column if not exists show_on_leaderboard boolean not null default true;

create index if not exists idx_members_points on members (points desc);

-- ---- point_ledger ----
create table if not exists point_ledger (
  id bigint generated always as identity primary key,
  member_id bigint not null references members (id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

alter table point_ledger enable row level security;
-- service-role bypasses RLS; no public policies on purpose — all access is
-- through the API routes, which enforce identity from the member session.
create index if not exists idx_ledger_member on point_ledger (member_id, created_at desc);
create index if not exists idx_ledger_ref on point_ledger (member_id, ref_type, ref_id);

-- ---- likes ----
create table if not exists likes (
  id bigint generated always as identity primary key,
  member_id bigint not null references members (id) on delete cascade,
  target_type text not null check (target_type in ('report', 'comment')),
  target_id text not null,
  created_at timestamptz not null default now(),
  constraint likes_unique_member_target unique (member_id, target_type, target_id)
);

alter table likes enable row level security;
-- service-role bypasses RLS; no public policies — writes go through
-- POST /api/likes/toggle (member session required).
create index if not exists idx_likes_target on likes (target_type, target_id);

-- ---- ratings ----
create table if not exists ratings (
  id bigint generated always as identity primary key,
  member_id bigint not null references members (id) on delete cascade,
  target_type text not null check (target_type in ('road', 'spot')),
  target_id text not null,
  stars integer not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  constraint ratings_unique_member_target unique (member_id, target_type, target_id)
);

alter table ratings enable row level security;
-- service-role bypasses RLS; no public policies — writes go through
-- POST /api/ratings (member session required).
create index if not exists idx_ratings_target on ratings (target_type, target_id);
