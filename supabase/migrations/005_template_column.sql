-- VoiceCV migration 005 — add template column to cvs.
-- Default 'modern' so existing CVs continue to render with the original design.
-- Run in Supabase SQL Editor after migration 004.
-- Idempotent.

begin;

alter table cvs
  add column if not exists template text not null default 'modern';

-- Optional: backfill any null rows (shouldn't exist due to NOT NULL DEFAULT,
-- but kept as a safety net).
update cvs set template = 'modern' where template is null;

commit;

-- Verify
select template, count(*) from cvs group by template;
