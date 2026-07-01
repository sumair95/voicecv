-- 014_cover_letter_unlock.sql
-- Cover letters are now FREE to generate + view, but DOWNLOAD is premium.
-- Downloading spends a cover_letter_credit once per CV and sets this flag, so
-- re-downloads are free thereafter.

alter table cvs add column if not exists cover_letter_unlocked boolean not null default false;

-- Verify:
-- select cover_letter_unlocked from cvs where id = '<cv-id>';
