-- 008_cv_language.sql
-- Persist the language a CV's text was written in, so the preview + PDF use
-- the right section headings (Italian CVs → Italian headings; everything else
-- → English). Existing rows default to 'en', which is correct since all CVs
-- generated before this change were written in English.

alter table cvs add column if not exists language text not null default 'en';

-- Verify: every existing row should read 'en'.
-- select language, count(*) from cvs group by language;
