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
