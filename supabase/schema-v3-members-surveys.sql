-- জনতার কথা — Phase 3 migration: members + area surveys
-- Run AFTER supabase/schema.sql AND supabase/schema-v2-locations.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - members          — registered citizens. Identity = phone number
--                       (unique, no OTP by design). Home area + current area
--                       both use the Phase-2 location hierarchy. The current
--                       area is SELF-DECLARED by the member, never GPS.
--  - surveys          — admin-created polls targeted at an area scope
--                       (all / division / district / upazila / thana / union).
--  - survey_responses — one vote per member per survey; home thana/union are
--                       snapshotted at vote time for the admin breakdown.
--
-- Privacy: phone numbers live only in `members` and are exposed solely
-- through the admin-gated API (service role). RLS below grants public read
-- on surveys only; members / survey_responses have no public policies —
-- every access goes through the Next.js API routes with the service role.

-- ============ TABLES ============

create table if not exists members (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null unique,
  home_division_id bigint references divisions(id),
  home_district_id bigint references districts(id),
  home_upazila_id bigint references upazilas(id),
  home_thana_id bigint references thanas(id),
  home_union_id bigint references unions(id),
  current_division_id bigint references divisions(id),
  current_district_id bigint references districts(id),
  current_upazila_id bigint references upazilas(id),
  current_thana_id bigint references thanas(id),
  current_union_id bigint references unions(id),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists surveys (
  id bigint generated always as identity primary key,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  target_level text not null default 'all'
    check (target_level in ('all','division','district','upazila','thana','union')),
  target_id bigint,
  status text not null default 'active'
    check (status in ('active','closed')),
  created_at timestamptz not null default now()
);

create table if not exists survey_responses (
  id bigint generated always as identity primary key,
  survey_id bigint not null references surveys(id) on delete cascade,
  member_id bigint not null references members(id) on delete cascade,
  option_index integer not null,
  home_thana_id bigint references thanas(id),
  home_union_id bigint references unions(id),
  created_at timestamptz not null default now(),
  unique (survey_id, member_id)
);

create index if not exists idx_members_home_district on members (home_district_id);
create index if not exists idx_members_home_thana on members (home_thana_id);
create index if not exists idx_responses_survey on survey_responses (survey_id);

-- ============ ROW LEVEL SECURITY ============
-- Service role (used by the API routes) bypasses RLS. Public/anon clients
-- may read surveys only; members and responses stay fully private at the
-- database level as a second line of defence.

alter table members enable row level security;
alter table surveys enable row level security;
alter table survey_responses enable row level security;

drop policy if exists "public read" on surveys;
create policy "public read" on surveys for select using (true);
