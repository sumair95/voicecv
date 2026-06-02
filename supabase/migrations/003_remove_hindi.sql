-- VoiceCV migration 003 — remove Hindi language support.
-- Run this in the Supabase SQL Editor on a project that already has migration 002 applied.
-- Idempotent: re-running is a no-op if there are no Hindi rows.

begin;

delete from questions where language = 'hi';

-- Reset any user profiles that were on Hindi back to English so they can still log in.
update profiles set language = 'en' where language = 'hi';

commit;

-- Verify
select language, count(*) from questions group by language order by language;
-- Expected: ar = 9, en = 9, ur = 9 (total 27 rows)
