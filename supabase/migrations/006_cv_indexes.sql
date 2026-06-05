-- VoiceCV migration 006 — performance indexes on cvs.
-- Without these, the dashboard's "select * from cvs order by created_at desc
-- where user_id = $1" does a seq scan + sort. Hurts past a few hundred rows.
-- Run idempotent.

begin;

create index if not exists cvs_user_id_created_at_idx
  on cvs (user_id, created_at desc);

create index if not exists cvs_user_id_status_idx
  on cvs (user_id, status);

-- For the questions fetch on the recording page.
create index if not exists questions_language_order_idx
  on questions (language, order_index);

commit;

-- Verify
select indexname from pg_indexes
where tablename in ('cvs','questions')
  and indexname like 'cvs_%' or indexname like 'questions_%';
