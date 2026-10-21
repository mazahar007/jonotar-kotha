-- জনতার কথা — Phase 9 migration: emergency broadcasts (জরুরি ঘোষণা)
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql, schema-v7-comments.sql AND schema-v8-push.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - emergency_broadcasts — area-targeted emergency announcements.
--    Scope columns are each nullable: broadcast targets one area level and
--    null = wider (all four null = nationwide). expires_at makes a
--    broadcast disappear from the public feed once passed.
--
-- RLS: public read of ACTIVE rows (expires_at > now()) only; writes go
-- through the service-role admin API routes (lib/broadcasts.ts).

create table if not exists emergency_broadcasts (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  scope_division_id int null references divisions(id) on delete set null,
  scope_district_id int null references districts(id) on delete set null,
  scope_upazila_id int null references upazilas(id) on delete set null,
  scope_thana_id int null references thanas(id) on delete set null,
  expires_at timestamptz not null,
  created_by text null,
  created_at timestamptz not null default now()
);

alter table emergency_broadcasts enable row level security;

-- Public may read only still-active broadcasts.
drop policy if exists public_read_active_broadcasts on emergency_broadcasts;
create policy public_read_active_broadcasts on emergency_broadcasts
  for select using (expires_at > now());

create index if not exists idx_broadcasts_expires
  on emergency_broadcasts (expires_at desc);
create index if not exists idx_broadcasts_scope_upazila
  on emergency_broadcasts (scope_upazila_id);
