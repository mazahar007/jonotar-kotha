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
