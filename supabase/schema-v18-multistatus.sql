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
