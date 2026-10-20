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
