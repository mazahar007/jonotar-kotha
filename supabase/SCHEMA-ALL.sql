-- =============================================================
-- জনতার কথা — সম্পূর্ণ ডেটাবেজ স্কিমা (একবারে চালান)
-- Supabase Dashboard → SQL Editor → New Query → পেস্ট → Run
-- =============================================================


-- -------------------------------------------------------------
-- ধাপ 1: schema.sql
-- -------------------------------------------------------------

-- জনতার কথা — Supabase schema
-- Supabase Dashboard → SQL Editor → paste → Run

-- ============ TABLES ============

create table if not exists categories (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order integer not null default 0
);

create table if not exists reports (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null default '',
  category text not null default '',
  category_id bigint references categories(id),
  location_name text not null default '',
  distance_m integer,
  is_anonymous boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending','verified','in_progress','resolved','urgent')),
  evidence_url text,
  created_at timestamptz not null default now(),
  time_ago text not null default ''
);

create table if not exists volunteers (
  id bigint generated always as identity primary key,
  name text not null,
  role text not null default '',
  points integer not null default 0,
  sort_order integer not null default 0
);

create table if not exists blood_donors (
  id bigint generated always as identity primary key,
  name text not null,
  blood_group text not null default '',
  phone_masked text not null default '',
  is_active boolean not null default true,
  distance_m integer
);

create table if not exists sos_alerts (
  id bigint generated always as identity primary key,
  alert_type text not null default '',
  location text not null default '',
  status text not null default 'sent',
  created_at timestamptz not null default now()
);

create table if not exists evidence_items (
  id bigint generated always as identity primary key,
  title text not null,
  media_url text,
  encrypted boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists family_members (
  id bigint generated always as identity primary key,
  name text not null,
  relation text not null default '',
  status text not null default '',
  location_name text not null default '',
  is_live boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists guides (
  id bigint generated always as identity primary key,
  name text not null,
  rating numeric not null default 0,
  distance_m integer,
  verified boolean not null default false
);

create table if not exists shelters (
  id bigint generated always as identity primary key,
  name text not null,
  shelter_type text not null default '',
  distance_m integer
);

create table if not exists map_incidents (
  id bigint generated always as identity primary key,
  kind text not null default '',
  label text not null default '',
  lat double precision not null default 0,
  lng double precision not null default 0
);

create table if not exists area_ratings (
  id bigint generated always as identity primary key,
  area text not null,
  score numeric not null default 0,
  votes integer not null default 0
);

create table if not exists municipality_updates (
  id bigint generated always as identity primary key,
  report_id bigint references reports(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- ============ RLS ============
-- Public read on non-sensitive tables; all writes go through the
-- Next.js API routes using the service-role key (server-side only).

alter table categories enable row level security;
alter table reports enable row level security;
alter table volunteers enable row level security;
alter table blood_donors enable row level security;
alter table sos_alerts enable row level security;
alter table evidence_items enable row level security;
alter table family_members enable row level security;
alter table guides enable row level security;
alter table shelters enable row level security;
alter table map_incidents enable row level security;
alter table area_ratings enable row level security;
alter table municipality_updates enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','reports','volunteers','blood_donors','sos_alerts',
    'evidence_items','family_members','guides','shelters',
    'map_incidents','area_ratings','municipality_updates'
  ] loop
    execute format(
      'drop policy if exists "public read" on %I; create policy "public read" on %I for select using (true);',
      t, t
    );
  end loop;
end $$;

-- ============ STORAGE ============
-- Private bucket for encrypted evidence uploads.

insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

drop policy if exists "service role full access evidence" on storage.objects;
create policy "service role full access evidence"
on storage.objects for all
using (bucket_id = 'evidence')
with check (bucket_id = 'evidence');

-- ============ SEED DATA ============

insert into categories (name, sort_order) values
  ('সব', 1), ('সামাজিক', 2), ('নিরাপত্তা', 3), ('সড়ক ও যানজট', 4),
  ('নারী নিরাপত্তা', 5), ('দুর্যোগ', 6), ('বন্যা', 7), ('ভ্রমণ সহায়তা', 8),
  ('দুর্নীতি', 9), ('রক্ত', 10), ('স্বাস্থ্য', 11)
on conflict do nothing;

insert into reports (title, description, category, category_id, location_name, distance_m, is_anonymous, status, time_ago, created_at) values
  ('গাঙ্গিনাপাড় মোড়ে সন্ধ্যার পর বখাটেদের উৎপাত বাড়ছে',
   'গত ৩ দিন ধরে সন্ধ্যা ৭টার পর মেয়েদের স্কুল ছুটির সময় বাজে মন্তব্য করা হচ্ছে। পুলিশ টহল বাড়ানোর অনুরোধ।',
   'নারী নিরাপত্তা', 5, 'গাঙ্গিনাপাড়', 120, false, 'verified', '১২ মিনিট আগে', now() - interval '12 minutes'),
  ('পৌরসভায় জন্ম নিবন্ধনে অতিরিক্ত টাকা চাওয়া হচ্ছে',
   'সাধারণ ফি ৫০ টাকা হলেও ৩০০ টাকা দাবি করা হচ্ছে, রশিদ ছাড়া। প্রমাণ ভিডিও আছে কিন্তু পরিচয় গোপন রাখতে চাই।',
   'দুর্নীতি', 9, 'পৌরসভা কার্যালয়', 450, true, 'pending', '৩৪ মিনিট আগে', now() - interval '34 minutes'),
  ('ব্রিজ রোডে বিশাল গর্ত, দুর্ঘটনার ঝুঁকি',
   'গতকাল রাতে একটি অটো উল্টে যায়। দ্রুত মেরামত প্রয়োজন। ছবি ও লোকেশন সংযুক্ত।',
   'সড়ক ও যানজট', 4, 'ব্রিজ রোড', 800, false, 'in_progress', '১ ঘণ্টা আগে', now() - interval '1 hour'),
  ('রক্ত প্রয়োজন ময়মনসিংহ মেডিকেলে',
   'আমার বোনের অপারেশন আজ রাত ৯টায়। ২ ব্যাগ রক্ত প্রয়োজন। যোগাযোগ: ০১৭...',
   'রক্ত', 10, 'মমেক হাসপাতাল', 1200, false, 'urgent', '২ ঘণ্টা আগে', now() - interval '2 hours')
on conflict do nothing;

insert into volunteers (name, role, points, sort_order) values
  ('সাব্বির হোসেন', 'রক্তদাতা', 1250, 1),
  ('নুসরাত জাহান', 'নিরাপত্তা সহায়ক', 980, 2),
  ('রাকিবুল ইসলাম', 'উদ্ধারকর্মী', 870, 3)
on conflict do nothing;

insert into blood_donors (name, blood_group, phone_masked, is_active, distance_m) values
  ('সাব্বির হোসেন', 'B+', '০১৭**-***২১', true, 300),
  ('নুসরাত জাহান', 'AB+', '০১৮**-***৪৫', true, 520),
  ('রাকিবুল ইসলাম', 'A-', '০১৯**-***৭৮', true, 800),
  ('তানিয়া আক্তার', 'O+', '০১৬**-***৩৩', true, 950),
  ('মেহেদী হাসান', 'B+', '০১৩**-***৬১', true, 1100)
on conflict do nothing;

insert into evidence_items (title, encrypted, expires_at, created_at) values
  ('৩০সে ভিডিও — পৌরসভা কার্যালয়', true, now() + interval '30 days', now() - interval '34 minutes')
on conflict do nothing;

insert into family_members (name, relation, status, location_name, is_live, sort_order) values
  ('মা', 'মা', 'বাড়িতে', 'বাড়ি', false, 1),
  ('বাবা', 'বাবা', 'বাজারে', 'বাজার', false, 2),
  ('ছোট বোন', 'ছোট বোন', 'স্কুলে', 'স্কুল', true, 3)
on conflict do nothing;

insert into guides (name, rating, distance_m, verified) values
  ('রফিক গাইড', 4.9, 200, true),
  ('আলম ট্যুর', 4.7, 450, true)
on conflict do nothing;

insert into shelters (name, shelter_type, distance_m) values
  ('চায়ের দোকান — গাঙ্গিনাপাড়', 'নিরাপদ আশ্রয়', 150),
  ('কমিউনিটি সেন্টার — চরপাড়া', 'নিরাপদ আশ্রয়', 600)
on conflict do nothing;

insert into map_incidents (kind, label, lat, lng) values
  ('flood', 'বন্যা স্তর', 24.7471, 90.4203),
  ('women_safety', 'নারী নিরাপত্তা', 24.7501, 90.4253),
  ('road_broken', 'রাস্তা ভাঙা', 24.7441, 90.4153),
  ('shelter', 'নিরাপদ আশ্রয় - চায়ের দোকান রাত ২টা', 24.7481, 90.4223),
  ('volunteer', 'স্বেচ্ছাসেবক', 24.7491, 90.4283)
on conflict do nothing;

insert into area_ratings (area, score, votes) values
  ('গাঙ্গিনাপাড়', 3.8, 124),
  ('ব্রিজ রোড', 3.2, 86),
  ('চরপাড়া', 4.1, 203),
  ('কাচিঝুলি', 3.5, 97)
on conflict do nothing;

insert into municipality_updates (report_id, note, created_at)
select r.id, '২ দিন আগে পৌরসভা দেখেছে — মেরামতের কাজ শিগগির শুরু হবে', now() - interval '2 days'
from reports r where r.title like 'ব্রিজ রোডে বিশাল গর্ত%'
limit 1
on conflict do nothing;

-- -------------------------------------------------------------
-- ধাপ 2: schema-v2-locations.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 2 migration: location hierarchy + report media
-- Run AFTER supabase/schema.sql: Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds: divisions / districts / upazilas / thanas / unions tables,
-- location FK columns + media_urls on reports, and the public `media`
-- storage bucket used by POST /api/upload.
--
-- Seed (verified 2026-10-21):
--  - All 8 divisions — Wikipedia "Divisions of Bangladesh".
--  - Mymensingh Division's 4 districts — Wikipedia "Administrative divisions of Bangladesh".
--  - Mymensingh District's 13 upazilas — Wikipedia "Mymensingh District".
--  - Mymensingh Sadar Upazila: Kotwali Model Thana + its CURRENT 12 union
--    parishads — Wikipedia "Mymensingh Sadar Upazila". (The former Akua Union
--    was incorporated into Mymensingh City Corporation, so there are 12, not 13.)
--  - Other districts/upazilas are added phase-by-phase from the admin
--    panel (লোকেশন tab) or future seed files.

-- ============ LOCATION TABLES ============

create table if not exists divisions (
  id bigint generated always as identity primary key,
  name_bn text not null,
  name_en text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

create table if not exists districts (
  id bigint generated always as identity primary key,
  division_id bigint not null references divisions(id) on delete cascade,
  name_bn text not null,
  name_en text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

create table if not exists upazilas (
  id bigint generated always as identity primary key,
  district_id bigint not null references districts(id) on delete cascade,
  name_bn text not null,
  name_en text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

create table if not exists thanas (
  id bigint generated always as identity primary key,
  upazila_id bigint not null references upazilas(id) on delete cascade,
  name_bn text not null,
  name_en text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

create table if not exists unions (
  id bigint generated always as identity primary key,
  upazila_id bigint not null references upazilas(id) on delete cascade,
  name_bn text not null,
  name_en text not null default '',
  slug text not null default '',
  sort_order integer not null default 0
);

-- ============ REPORTS: location FKs + media ============

alter table reports
  add column if not exists division_id bigint references divisions(id),
  add column if not exists district_id bigint references districts(id),
  add column if not exists upazila_id bigint references upazilas(id),
  add column if not exists thana_id bigint references thanas(id),
  add column if not exists union_id bigint references unions(id),
  add column if not exists media_urls text[] not null default '{}';

-- ============ RLS (public read; writes via service-role API) ============

alter table divisions enable row level security;
alter table districts enable row level security;
alter table upazilas enable row level security;
alter table thanas enable row level security;
alter table unions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['divisions','districts','upazilas','thanas','unions'] loop
    execute format(
      'drop policy if exists "public read" on %I; create policy "public read" on %I for select using (true);',
      t, t
    );
  end loop;
end $$;

-- ============ STORAGE: public media bucket (report photos/videos) ============

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "public read media" on storage.objects;
create policy "public read media"
on storage.objects for select
using (bucket_id = 'media');

drop policy if exists "service role full access media" on storage.objects;
create policy "service role full access media"
on storage.objects for all
using (bucket_id = 'media')
with check (bucket_id = 'media');

-- ============ SEED: divisions (all 8) ============

insert into divisions (name_bn, name_en, slug, sort_order) values
  ('ঢাকা', 'Dhaka', 'dhaka', 1),
  ('চট্টগ্রাম', 'Chattogram', 'chattogram', 2),
  ('খুলনা', 'Khulna', 'khulna', 3),
  ('রাজশাহী', 'Rajshahi', 'rajshahi', 4),
  ('বরিশাল', 'Barishal', 'barishal', 5),
  ('রংপুর', 'Rangpur', 'rangpur', 6),
  ('সিলেট', 'Sylhet', 'sylhet', 7),
  ('ময়মনসিংহ', 'Mymensingh', 'mymensingh', 8)
on conflict do nothing;

-- ============ SEED: Mymensingh Division districts ============

insert into districts (division_id, name_bn, name_en, slug, sort_order)
select d.id, v.name_bn, v.name_en, v.slug, v.sort_order
from divisions d
join (values
  ('ময়মনসিংহ', 'Mymensingh', 'mymensingh', 1),
  ('জামালপুর', 'Jamalpur', 'jamalpur', 2),
  ('শেরপুর', 'Sherpur', 'sherpur', 3),
  ('নেত্রকোণা', 'Netrokona', 'netrokona', 4)
) as v(name_bn, name_en, slug, sort_order) on true
where d.slug = 'mymensingh'
on conflict do nothing;

-- ============ SEED: Mymensingh District upazilas (13) ============

insert into upazilas (district_id, name_bn, name_en, slug, sort_order)
select di.id, v.name_bn, v.name_en, v.slug, v.sort_order
from districts di
join divisions dv on dv.id = di.division_id and dv.slug = 'mymensingh'
join (values
  ('ময়মনসিংহ সদর', 'Mymensingh Sadar', 'mymensingh-sadar', 1),
  ('ভালুকা', 'Bhaluka', 'bhaluka', 2),
  ('ধোবাউড়া', 'Dhobaura', 'dhobaura', 3),
  ('ফুলবাড়িয়া', 'Fulbaria', 'fulbaria', 4),
  ('গফরগাঁও', 'Gaffargaon', 'gaffargaon', 5),
  ('গৌরীপুর', 'Gouripur', 'gouripur', 6),
  ('হালুয়াঘাট', 'Haluaghat', 'haluaghat', 7),
  ('ঈশ্বরগঞ্জ', 'Ishwarganj', 'ishwarganj', 8),
  ('মুক্তাগাছা', 'Muktagachha', 'muktagachha', 9),
  ('নান্দাইল', 'Nandail', 'nandail', 10),
  ('ফুলপুর', 'Phulpur', 'phulpur', 11),
  ('তারাকান্দা', 'Tarakanda', 'tarakanda', 12),
  ('ত্রিশাল', 'Trishal', 'trishal', 13)
) as v(name_bn, name_en, slug, sort_order) on true
where di.slug = 'mymensingh'
on conflict do nothing;

-- ============ SEED: Mymensingh Sadar thana ============

insert into thanas (upazila_id, name_bn, name_en, slug, sort_order)
select u.id, 'কোতোয়ালী মডেল থানা', 'Kotwali Model Thana', 'kotwali-model', 1
from upazilas u
where u.slug = 'mymensingh-sadar'
on conflict do nothing;

-- ============ SEED: Mymensingh Sadar unions (current 12) ============

insert into unions (upazila_id, name_bn, name_en, slug, sort_order)
select u.id, v.name_bn, v.name_en, v.slug, v.sort_order
from upazilas u
join (values
  ('অষ্টধার', 'Austadhar', 'austadhar', 1),
  ('ভাবখালী', 'Bhabkhali', 'bhabkhali', 2),
  ('বড়রচর', 'Bororchar', 'bororchar', 3),
  ('বৈরা', 'Boyra', 'boyra', 4),
  ('চর ঈশ্বরদিয়া', 'Char Ishwardia', 'char-ishwardia', 5),
  ('চর নিলক্ষিয়া', 'Char Nilakshia', 'char-nilakshia', 6),
  ('দাপুনিয়া', 'Dapunia', 'dapunia', 7),
  ('ঘাগড়া', 'Ghagra', 'ghagra', 8),
  ('খাগডহর', 'Khagdahar', 'khagdahar', 9),
  ('কুষ্টিয়া', 'Kushtia', 'kushtia', 10),
  ('পরাণগঞ্জ', 'Paranganj', 'paranganj', 11),
  ('সিরতা', 'Sirta', 'sirta', 12)
) as v(name_bn, name_en, slug, sort_order) on true
where u.slug = 'mymensingh-sadar'
on conflict do nothing;

-- -------------------------------------------------------------
-- ধাপ 3: schema-v3-members-surveys.sql
-- -------------------------------------------------------------

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

-- -------------------------------------------------------------
-- ধাপ 4: schema-v4-roads.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 4 migration: area road conditions with live updates
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql AND
-- schema-v3-members-surveys.sql: Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - roads        — a named road tied to the Phase-2 location hierarchy
--                   (বিভাগ → জেলা → উপজেলা → থানা → ইউনিয়ন; thana/union nullable).
--  - road_updates — citizen "লাইভ আপডেট" entries. A road's CURRENT status
--                   is simply its newest update (by created_at).
--  - Status keys (displayed in Bengali by the app):
--      good ভালো · fair মোটামুটি · bad ভাঙা / ঝুঁকিপূর্ণ · repair মেরামত চলছে ·
--      traffic যানজট · waterlogged জলাবদ্ধ · closed বন্ধ
--
-- Seed: the 5 Mymensingh Sadar roads used by the demo fallback
-- (lib/roads-fallback.ts), with staggered update times.

-- ============ TABLES ============

create table if not exists roads (
  id bigint generated always as identity primary key,
  name text not null,
  from_place text,
  to_place text,
  division_id bigint references divisions(id),
  district_id bigint references districts(id),
  upazila_id bigint references upazilas(id),
  thana_id bigint references thanas(id),
  union_id bigint references unions(id),
  created_at timestamptz not null default now()
);

create table if not exists road_updates (
  id bigint generated always as identity primary key,
  road_id bigint not null references roads(id) on delete cascade,
  status text not null
    check (status in ('good','fair','bad','repair','traffic','waterlogged','closed')),
  note text not null,
  media_url text,
  reporter_name text,
  created_at timestamptz not null default now()
);

create index if not exists idx_roads_upazila on roads (upazila_id);
create index if not exists idx_road_updates_road_time on road_updates (road_id, created_at desc);

-- ============ ROW LEVEL SECURITY ============
-- Public read (road conditions are public information). All writes go
-- through the Next.js API routes with the service role, which bypasses RLS.

alter table roads enable row level security;
alter table road_updates enable row level security;

drop policy if exists "public read" on roads;
create policy "public read" on roads for select using (true);

drop policy if exists "public read" on road_updates;
create policy "public read" on road_updates for select using (true);

-- ============ SEED: Mymensingh Sadar roads ============
-- Hierarchy resolved by slug so the seed works on the Phase-2 data.

insert into roads (name, from_place, to_place, division_id, district_id, upazila_id, thana_id, union_id)
select v.name, v.from_place, v.to_place, dv.id, ds.id, u.id, t.id, null
from upazilas u
join districts ds on ds.id = u.district_id
join divisions dv on dv.id = ds.division_id
left join thanas t on t.upazila_id = u.id and t.slug = 'kotwali-model'
join (values
  ('ব্রিজ রোড', 'গাঙ্গিনাপাড় মোড়', 'ব্রহ্মপুত্র ব্রিজ'),
  ('গাঙ্গিনাপাড় মোড় – চরপাড়া রোড', 'গাঙ্গিনাপাড় মোড়', 'চরপাড়া'),
  ('ঢাকা–ময়মনসিংহ মহাসড়ক (শহর অংশ)', 'শহরের প্রবেশমুখ', 'চরপাড়া মোড়'),
  ('আকুয়া–কেওয়াটখালী রোড', 'আকুয়া', 'কেওয়াটখালী'),
  ('শম্ভুগঞ্জ রোড', 'নগর ভবন মোড়', 'শম্ভুগঞ্জ')
) as v(name, from_place, to_place) on true
where u.slug = 'mymensingh-sadar'
  and not exists (select 1 from roads r where r.name = v.name);

-- ============ SEED: road updates (staggered; newest = current status) ============

-- ব্রিজ রোড — fair (২ দিন আগে) → bad (৫ ঘণ্টা আগে) → repair (১ ঘণ্টা আগে, current)
insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'fair', 'কিছু জায়গায় খানাখন্দ আছে, সাবধানে চলাচল করুন', 'মোঃ রফিকুল ইসলাম', now() - interval '2 days'
from roads r where r.name = 'ব্রিজ রোড'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'bad', 'বিশাল গর্ত, দুর্ঘটনার ঝুঁকি — গতকাল রাতে একটি অটো উল্টে যায়', 'সাব্বির হোসেন', now() - interval '5 hours'
from roads r where r.name = 'ব্রিজ রোড'
  and (select count(*) from road_updates x where x.road_id = r.id) = 1;

insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'repair', 'পৌরসভার লোক এসে গর্তে ইট-বালু ফেলছে, মেরামত চলছে', 'নুসরাত জাহান', now() - interval '1 hour'
from roads r where r.name = 'ব্রিজ রোড'
  and (select count(*) from road_updates x where x.road_id = r.id) = 2;

-- গাঙ্গিনাপাড় মোড় – চরপাড়া রোড — traffic (current)
insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'traffic', 'সন্ধ্যায় প্রচণ্ড যানজট, সম্ভব হলে বিকল্প রাস্তা ব্যবহার করুন', 'রাকিবুল ইসলাম', now() - interval '3 hours'
from roads r where r.name = 'গাঙ্গিনাপাড় মোড় – চরপাড়া রোড'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- ঢাকা–ময়মনসিংহ মহাসড়ক (শহর অংশ) — good (current)
insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'good', 'রাস্তা স্বাভাবিক, যান চলাচল মসৃণ', 'মোঃ তানভীর আহমেদ', now() - interval '1 day'
from roads r where r.name = 'ঢাকা–ময়মনসিংহ মহাসড়ক (শহর অংশ)'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- আকুয়া–কেওয়াটখালী রোড — waterlogged (current)
insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'waterlogged', 'বৃষ্টির পানি জমে আছে, কিছু অংশে হাঁটু পানি', 'মোছাঃ শারমিন আক্তার', now() - interval '6 hours'
from roads r where r.name = 'আকুয়া–কেওয়াটখালী রোড'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- শম্ভুগঞ্জ রোড — fair (current)
insert into road_updates (road_id, status, note, reporter_name, created_at)
select r.id, 'fair', 'মোটামুটি ভালো, যান চলাচল কিছুটা ধীরগতি', 'মোঃ আরিফুল ইসলাম', now() - interval '2 hours'
from roads r where r.name = 'শম্ভুগঞ্জ রোড'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- -------------------------------------------------------------
-- ধাপ 5: schema-v5-spots.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 5 migration: গুরুত্বপূর্ণ স্থান/মোড় (spots) + এক-ক্লিক কুইক আপডেট
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql AND schema-v4-roads.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - roads.kind            — 'road' (রোড) | 'spot' (গুরুত্বপূর্ণ স্থান / মোড়).
--                            A spot reuses the whole roads machinery: current
--                            condition = newest update, timeline, area filter.
--  - roads.locality_name   — এলাকার নাম for spots (e.g. 'চরপাড়া'), optional.
--  - road_updates.preset_key — set when an update was posted by a one-tap
--                            preset chip (lib/presets.ts); null = typed update.
--  - Status list extended with one-tap preset statuses:
--      traffic_light হালকা জ্যাম · incident ঝামেলা চলতেছে · accident দুর্ঘটনা ·
--      power_out বিদ্যুৎ নাই · power_back বিদ্যুৎ এসেছে · gas_out গ্যাস নাই ·
--      gas_back গ্যাস এসেছে · water_out পানি নাই · water_back পানি এসেছে
--
-- Seed: 6 Mymensingh Sadar spots (lib/roads-fallback.ts mirrors this data).

-- ============ COLUMNS ============

alter table roads add column if not exists kind text not null default 'road';
alter table roads add column if not exists locality_name text;

alter table roads drop constraint if exists roads_kind_check;
alter table roads add constraint roads_kind_check check (kind in ('road','spot'));

alter table road_updates add column if not exists preset_key text;

-- ============ EXTEND STATUS CHECK ============

alter table road_updates drop constraint if exists road_updates_status_check;
alter table road_updates add constraint road_updates_status_check
  check (status in (
    'good','fair','bad','repair','traffic','waterlogged','closed',
    'traffic_light','incident','accident',
    'power_out','power_back','gas_out','gas_back','water_out','water_back'
  ));

create index if not exists idx_roads_kind_upazila on roads (kind, upazila_id);

-- ============ SEED: Mymensingh Sadar spots ============
-- Hierarchy resolved by slug (কোতোয়ালী মডেল থানা; unions NULL — city area).

insert into roads (name, kind, locality_name, from_place, to_place, division_id, district_id, upazila_id, thana_id, union_id)
select v.name, 'spot', v.locality, null, null, dv.id, ds.id, u.id, t.id, null
from upazilas u
join districts ds on ds.id = u.district_id
join divisions dv on dv.id = ds.division_id
left join thanas t on t.upazila_id = u.id and t.slug = 'kotwali-model'
join (values
  ('চরপাড়া মোড়', 'চরপাড়া'),
  ('নতুন বাজার', 'নতুন বাজার'),
  ('জিলা স্কুল মোড়', 'জিলা স্কুল'),
  ('ব্রিজ মোড়', 'ব্রিজ'),
  ('গাঙ্গিনাপাড় মোড়', 'গাঙ্গিনাপাড়'),
  ('টাউন হল মোড়', 'টাউন হল')
) as v(name, locality) on true
where u.slug = 'mymensingh-sadar'
  and not exists (select 1 from roads r where r.name = v.name and r.kind = 'spot');

-- ============ SEED: spot updates (preset posts; newest = current condition) ============

-- চরপাড়া মোড় — জ্যাম বেশি (৩৫ মিনিট আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'traffic', 'চরপাড়া মোড়ে জ্যাম বেশি', 'সাব্বির হোসেন', 'heavy_traffic', now() - interval '35 minutes'
from roads r where r.name = 'চরপাড়া মোড়' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- নতুন বাজার — সব স্বাভাবিক (১ ঘণ্টা আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'good', 'সব স্বাভাবিক', 'রাকিবুল ইসলাম', 'all_normal', now() - interval '1 hour'
from roads r where r.name = 'নতুন বাজার' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- জিলা স্কুল মোড় — বিদ্যুৎ নাই (২০ মিনিট আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'power_out', 'এলাকায় এখন বিদ্যুৎ নাই', 'নুসরাত জাহান', 'power_out', now() - interval '20 minutes'
from roads r where r.name = 'জিলা স্কুল মোড়' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- ব্রিজ মোড় — হালকা জ্যাম (২ ঘণ্টা আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'traffic_light', 'হালকা জ্যাম', 'মোঃ আরিফুল ইসলাম', 'light_traffic', now() - interval '2 hours'
from roads r where r.name = 'ব্রিজ মোড়' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- গাঙ্গিনাপাড় মোড় — হালকা জ্যাম (৩ ঘণ্টা আগে) → ঝামেলা চলতেছে (৫০ মিনিট আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'traffic_light', 'হালকা জ্যাম', 'মোঃ তানভীর আহমেদ', 'light_traffic', now() - interval '3 hours'
from roads r where r.name = 'গাঙ্গিনাপাড় মোড়' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'incident', 'ঝামেলা চলতেছে', 'মোছাঃ শারমিন আক্তার', 'incident', now() - interval '50 minutes'
from roads r where r.name = 'গাঙ্গিনাপাড় মোড়' and r.kind = 'spot'
  and (select count(*) from road_updates x where x.road_id = r.id) = 1;

-- টাউন হল মোড় — সব স্বাভাবিক (৪ ঘণ্টা আগে, current)
insert into road_updates (road_id, status, note, reporter_name, preset_key, created_at)
select r.id, 'good', 'সব স্বাভাবিক', 'মোঃ রফিকুল ইসলাম', 'all_normal', now() - interval '4 hours'
from roads r where r.name = 'টাউন হল মোড়' and r.kind = 'spot'
  and not exists (select 1 from road_updates x where x.road_id = r.id);

-- -------------------------------------------------------------
-- ধাপ 6: schema-v6-live-shares.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 6 migration: SOS লাইভ লোকেশন শেয়ার (live_shares)
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql AND schema-v5-spots.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - live_shares — one-tap live location sharing sessions started from the
--    SOS page. A session produces a public link (/live/<id>) that anyone can
--    open to watch the sharer's live position. Sessions auto-expire 1 hour
--    after creation; the sharer can stop anytime.
--  - purpose: 'danger' বিপদে আছি | 'blood' রক্ত দরকার | 'help' সাহায্য দরকার |
--    'general' সাধারণ শেয়ার. blood_group is set only for purpose='blood'.
--  - owner_token — random secret returned ONCE at creation; ping/stop calls
--    must present it. It is NEVER exposed in any public/admin payload.
--  - phone is public ONLY when show_phone = true (sharer's choice).
--
-- RLS: enabled with NO public policies — every read/write goes through the
-- service-role API routes, which return sanitized payloads.

create table if not exists live_shares (
  id text primary key,
  member_id int references members(id) on delete set null,
  sharer_name text not null,
  phone text,
  show_phone boolean not null default false,
  purpose text not null check (purpose in ('danger','blood','help','general')),
  blood_group text,
  note text,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  is_active boolean not null default true,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_token text not null
);

alter table live_shares enable row level security;

create index if not exists idx_live_shares_purpose_active
  on live_shares (purpose, is_active, expires_at);
create index if not exists idx_live_shares_created
  on live_shares (created_at desc);

-- -------------------------------------------------------------
-- ধাপ 7: schema-v7-comments.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 7 migration: report comments + verify votes
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql
-- AND schema-v6-live-shares.sql:
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Adds:
--  - report_comments — public comments on a report. member_id links a
--    registered member (null = anonymous); display_name is the shown name
--    (member's name or a typed/“বেনামী” fallback); voter_key is the same
--    stable per-voter key used for verify votes (m:<member_id> or a:<uuid>),
--    used for the light anti-spam interval.
--  - report_verifications — one "আমিও দেখেছি" vote per voter per report:
--    UNIQUE(report_id, voter_key). The app treats ≥3 votes as "যাচাইকৃত".
--
-- RLS: enabled with NO public policies — every read/write goes through the
-- service-role API routes (lib/report-comments.ts), which return sanitized
-- payloads and enforce the anti-spam interval.

create table if not exists report_comments (
  id bigint generated always as identity primary key,
  report_id bigint not null references reports(id) on delete cascade,
  member_id int references members(id) on delete set null,
  display_name text not null default 'বেনামী',
  body text not null check (char_length(body) between 1 and 500),
  voter_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists report_verifications (
  id bigint generated always as identity primary key,
  report_id bigint not null references reports(id) on delete cascade,
  member_id int references members(id) on delete set null,
  voter_key text not null,
  created_at timestamptz not null default now(),
  unique (report_id, voter_key)
);

alter table report_comments enable row level security;
alter table report_verifications enable row level security;

create index if not exists idx_report_comments_report
  on report_comments (report_id, created_at);
create index if not exists idx_report_comments_spam
  on report_comments (report_id, voter_key, created_at desc);
create index if not exists idx_report_verifications_report
  on report_verifications (report_id);

-- -------------------------------------------------------------
-- ধাপ 8: schema-v8-push.sql
-- -------------------------------------------------------------

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

-- -------------------------------------------------------------
-- ধাপ 9: schema-v9-broadcasts.sql
-- -------------------------------------------------------------

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

-- -------------------------------------------------------------
-- ধাপ 10: schema-v11-contacts.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 11 migration: trusted contacts (আমার পরিচিতজন)
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql, schema-v7-comments.sql, schema-v8-push.sql,
-- schema-v9-broadcasts.sql AND any phase-10 migration (Supabase Dashboard → SQL Editor → paste → Run)
--
-- Adds:
--  - trusted_contacts — a registered member's emergency contacts. Each row
--    belongs to exactly one member (member_id). A member's contacts are
--    PRIVATE: visible only to the owning member (via their phone-session
--    cookie/token) and to the admin. They are NEVER exposed publicly.
--  - SOS integration (app-side, Phase 6 flow): when a member starts a live
--    share, the app offers one-tap WhatsApp deep links per contact with a
--    prefilled Bengali SOS message containing the live link. Honest note:
--    the web cannot send SMS on its own — alerting uses WhatsApp deep links
--    plus copy-link; no fake "SMS sent" claims anywhere in the UI.
--  - In-app alert (app-side, Phase 8 notification center): if a contact's
--    phone matches a registered member, a notification is recorded in the
--    in-app center when the SOS share starts. BEST-EFFORT and documented:
--    the Phase 8 center is a global feed (no per-member targeting exists
--    yet), so this notification is visible to all app users — it reaches the
--    registered contact through the shared feed, not as a private alert.
--
-- RLS: enabled with NO public policies — every read/write goes through the
-- service-role API routes (lib/trusted-contacts.ts), which enforce
-- ownership server-side and return 401 for logged-out callers.

create table if not exists trusted_contacts (
  id bigint generated always as identity primary key,
  member_id bigint not null references members(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

alter table trusted_contacts enable row level security;

create index if not exists idx_trusted_contacts_member
  on trusted_contacts (member_id);

-- -------------------------------------------------------------
-- ধাপ 11: schema-v13-auth.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 13 migration: 🔐 ফোন/ইমেইল রেজিস্ট্রেশন + OTP ভেরিফিকেশন
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql, schema-v7-comments.sql, schema-v8-push.sql,
-- schema-v9-broadcasts.sql AND schema-v11-contacts.sql
-- (Supabase Dashboard → SQL Editor → paste → Run)
--
-- Adds:
--  - members.email (nullable UNIQUE), phone now nullable (email-only accounts),
--    phone_verified / email_verified booleans, account_status
--    ('verified' | 'unverified', default 'unverified'), points + badges
--    columns (filled by Phase 15 — present now so /api/members/me can
--    already expose them).
--  - otp_codes — 6-digit one-time codes. channel 'sms'|'email',
--    purpose 'register'|'login'|'verify_phone'. RLS enabled with NO public
--    policies — every read/write goes through the service-role API routes
--    (lib/otp.ts), which enforce the 5-min expiry, max 5 attempts and
--    60s resend cooldown server-side.
--
-- Honest note: OTP codes are stored as SHA-256 hashes — the plain code
-- exists only in the SMS/email we send (or in the demo banner when no
-- SMS/SMTP provider is configured).

-- ---- members: auth fields ----
alter table members
  add column if not exists email text,
  add column if not exists phone_verified boolean not null default false,
  add column if not exists email_verified boolean not null default false,
  add column if not exists account_status text not null default 'unverified'
    check (account_status in ('verified', 'unverified')),
  add column if not exists points integer not null default 0,
  add column if not exists badges text[] not null default '{}';

-- email-only accounts: phone must be nullable (was NOT NULL in schema-v3)
alter table members alter column phone drop not null;

-- unique email; unique phone already exists (nullable phone allows many NULLs)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'members_email_unique') then
    alter table members add constraint members_email_unique unique (email);
  end if;
end $$;

create index if not exists idx_members_email on members (email);
create index if not exists idx_members_account_status on members (account_status);

-- ---- otp_codes ----
create table if not exists otp_codes (
  id bigint generated always as identity primary key,
  channel text not null check (channel in ('sms', 'email')),
  destination text not null,
  code_hash text not null,
  purpose text not null check (purpose in ('register', 'login', 'verify_phone')),
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table otp_codes enable row level security;

-- service-role bypasses RLS; no public policies are created on purpose.
create index if not exists idx_otp_destination on otp_codes (destination, purpose);
create index if not exists idx_otp_expires on otp_codes (expires_at);

-- housekeeping: expired rows are deleted by the API before issuing new codes;
-- this optional cleanup also works on a schedule.
create or replace function cleanup_expired_otps() returns void
language sql as $$
  delete from otp_codes where expires_at < now() - interval '1 hour';
$$;

-- -------------------------------------------------------------
-- ধাপ 12: schema-v15-points.sql
-- -------------------------------------------------------------

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

-- -------------------------------------------------------------
-- ধাপ 13: schema-v18-multistatus.sql
-- -------------------------------------------------------------

-- জনতার কথা — Phase 18 migration: ✅ সর্বোচ্চ ৩ অপশন + 🔔 "বর্তমান অবস্থা জানতে চাই"
-- Run AFTER supabase/schema.sql, schema-v2-locations.sql,
-- schema-v3-members-surveys.sql, schema-v4-roads.sql, schema-v5-spots.sql,
-- schema-v6-live-shares.sql, schema-v7-comments.sql, schema-v8-push.sql,
-- schema-v9-broadcasts.sql, schema-v11-contacts.sql, schema-v13-auth.sql
-- AND schema-v15-points.sql
-- (Supabase Dashboard → SQL Editor → paste → Run)
--
-- Adds:
--  - road_updates.statuses (text[]) — up to 3 statuses per update
--    (backfilled from the legacy `status` column); road_updates.member_id
--    (posting member, nullable) for contributor lookup.
--  - roads.current_statuses (text[]) — denormalized latest statuses
--    (backfilled from each road's latest update).
--  - status_requests — "বর্তমান অবস্থা জানতে চাই" requests:
--    one ACTIVE request per (road, member); resolved when a new update arrives.
--  - notifications.member_id (nullable) — targeted in-app notifications
--    (null = global, visible to everyone).
--
-- RLS: public read on status_requests (pending counts are shown publicly);
-- all writes go through the Next.js API routes with the service role
-- (same pattern as road_updates — no public write policies on purpose).
-- notifications.member_id is write-only via service role; read policy stays
-- public (the API route filters per-member server-side).

-- ---- road_updates: multi-status + member link ----
alter table road_updates
  add column if not exists statuses text[] not null default '{}',
  add column if not exists member_id bigint references members(id) on delete set null;

-- Backfill: statuses = [status] where empty.
update road_updates
  set statuses = array[status]
  where (statuses is null or coalesce(array_length(statuses, 1), 0) = 0)
    and status is not null;

-- ---- roads: denormalized current statuses ----
alter table roads
  add column if not exists current_statuses text[] not null default '{}';

-- Backfill from each road's latest update.
update roads r
  set current_statuses = sub.statuses
  from (
    select distinct on (u.road_id) u.road_id, u.statuses
    from road_updates u
    order by u.road_id, u.created_at desc
  ) sub
  where r.id = sub.road_id
    and coalesce(array_length(r.current_statuses, 1), 0) = 0;

-- ---- status_requests ----
create table if not exists status_requests (
  id bigint generated always as identity primary key,
  road_id bigint not null references roads(id) on delete cascade,
  requester_member_id bigint not null references members(id) on delete cascade,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

-- One ACTIVE request per (road, member): a member may request again only
-- after their previous request was resolved by a new update.
drop index if exists uq_status_requests_active;
create unique index uq_status_requests_active
  on status_requests (road_id, requester_member_id)
  where resolved_at is null;

create index if not exists idx_status_requests_road
  on status_requests (road_id, resolved_at);

alter table status_requests enable row level security;

drop policy if exists "public read" on status_requests;
create policy "public read" on status_requests for select using (true);

-- ---- notifications: per-member targeting ----
alter table notifications
  add column if not exists member_id bigint references members(id) on delete cascade;

create index if not exists idx_notifications_member
  on notifications (member_id);

-- ============ SITE SETTINGS (Phase 21aj: fully dynamic site) ============
-- Key/value site content editable from /admin → সেটিংস (hero text, pills,
-- emergency numbers, site name). Public read; writes go through the
-- service-role API (admin session enforced by middleware).
create table if not exists settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;

drop policy if exists "public read" on settings;
create policy "public read" on settings for select using (true);

-- Seed: the values currently hardcoded on the live site.
insert into settings (key, value) values
  ('site_name', 'জনতার কথা'),
  ('hero_badge', 'সেবা চালু আছে আপনার এলাকায়'),
  ('hero_line1', 'জনতার কথা'),
  ('hero_line2', 'আপনার এলাকার'),
  ('hero_line3', 'ডিজিটাল প্ল্যাটফর্ম'),
  ('hero_subtext', 'সমস্যা জানান, রোডের অবস্থা দেখুন, জরুরি SOS — সব এক অ্যাপে। গ্রাম থেকে শহর, আমরা আছি সবখানে।'),
  ('hero_pills', '["বেনামী রিপোর্ট","লাইভ SOS","সম্পূর্ণ ফ্রি","রোড আপডেট"]'),
  ('emergency_numbers', '[{"name":"জাতীয় জরুরি সেবা","number":"999"},{"name":"নারী নির্যাতন প্রতিরোধ","number":"109"},{"name":"সরকারি তথ্য ও সেবা","number":"333"}]')
on conflict (key) do nothing;
