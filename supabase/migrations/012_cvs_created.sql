-- 012_cvs_created.sql
-- Free limit is "3 ever created" (lifetime), NOT "3 at a time". Deleting a CV
-- no longer frees a slot. cvs_created increments on each new CV; the cap is
-- FREE_CV_LIMIT (3, in code) + cv_credits.

alter table profiles add column if not exists cvs_created int not null default 0;

-- Backfill existing users to their current CV count so nobody is penalised.
update profiles p
  set cvs_created = (select count(*) from cvs c where c.user_id = p.id);

-- Atomic increment for the calling user, run after a new CV is inserted.
create or replace function increment_cvs_created()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update profiles set cvs_created = cvs_created + 1 where id = auth.uid();
end;
$$;

-- Verify:
-- select cvs_created, cv_credits from profiles where id = auth.uid();
