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
