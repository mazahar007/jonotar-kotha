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
