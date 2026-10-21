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
