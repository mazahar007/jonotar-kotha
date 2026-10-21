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
