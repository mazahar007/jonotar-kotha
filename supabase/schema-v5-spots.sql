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
