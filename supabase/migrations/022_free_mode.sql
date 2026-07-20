-- Free / testing mode. When ON, ALL premium features are free for EVERYONE (no
-- allowlist needed) and pricing is hidden in the UI — used while the project is
-- submitted for review so testers on any email can try premium without paying.
-- Flip off from /admin to re-enable paid features and pricing.

alter table app_settings add column if not exists free_mode boolean not null default false;

-- is_comp_account() now also returns true when free_mode is on, so every premium
-- route (which already gates on it) grants free access to any signed-in user
-- during the testing window — in addition to the per-email comp allowlist.
create or replace function is_comp_account()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select
    coalesce((select free_mode from app_settings where id = 1), false)
    or (
      coalesce((select comp_enabled from app_settings where id = 1), false)
      and exists (
        select 1
        from comp_accounts c
        join auth.users u on lower(u.email) = c.email
        where u.id = auth.uid()
      )
    );
$$;
