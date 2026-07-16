-- Comp (complimentary) access — lets specific reviewer accounts use every
-- premium feature (Premium CV, Cover Letter download, Job-match CV rewrite) for
-- FREE, without spending a credit or hitting Stripe. Scope is an allowlist of
-- emails, gated by a master switch, so real users are NEVER affected. Managed
-- from the /admin page (admin-email gated).
--
-- Effective comp for a user = comp_enabled (master switch) AND their email is on
-- the comp_accounts allowlist. Removing the email (or flipping the switch off)
-- restores normal charging instantly — no redeploy, since it's read at request
-- time.

-- Single-row settings table (the master switch). id is pinned to 1.
create table if not exists app_settings (
  id integer primary key default 1,
  comp_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint app_settings_single check (id = 1)
);
insert into app_settings (id) values (1) on conflict (id) do nothing;

-- Allowlisted reviewer emails (stored lowercased).
create table if not exists comp_accounts (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

-- Lock both tables: no RLS policies → only service_role (admin API) and
-- SECURITY DEFINER functions can touch them. Regular users can't read the list
-- or flip the switch.
alter table app_settings enable row level security;
alter table comp_accounts enable row level security;

-- Is the CURRENT user comped right now? SECURITY DEFINER so it can read the
-- locked tables + auth.users regardless of the caller's RLS; scoped to auth.uid()
-- so a user can only ever check themselves.
create or replace function is_comp_account()
returns boolean
language sql
security definer
set search_path = public, auth
as $$
  select coalesce((select comp_enabled from app_settings where id = 1), false)
     and exists (
       select 1
       from comp_accounts c
       join auth.users u on lower(u.email) = c.email
       where u.id = auth.uid()
     );
$$;

grant execute on function is_comp_account() to authenticated, anon;
