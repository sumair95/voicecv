-- 015_job_match.sql
-- AI Job Match — in-app apply + application tracking.
--
-- Job *listings* themselves are fetched live from JSearch (RapidAPI) and are
-- ephemeral; we only persist the ones a user chooses to save or apply to, as a
-- snapshot, so the tracker keeps working even if the listing disappears.

create table if not exists job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The CV the user matched with (nullable so a row survives CV deletion).
  cv_id uuid references cvs (id) on delete set null,

  -- Snapshot of the listing at save time.
  external_job_id text not null, -- provider-scoped id (JSearch job_id)
  source text default 'jsearch',
  title text not null,
  company text not null default '',
  location text,
  apply_url text,
  logo text,
  salary_text text,

  -- AI match metadata (captured from the ranked result, if any).
  match_score int,
  match_reason text,

  -- Tracking.
  status text not null default 'saved'
    check (status in ('saved', 'applied', 'interview', 'offer', 'rejected')),
  notes text,
  applied_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per (user, job): saving/applying the same listing twice just updates it.
create unique index if not exists job_applications_user_job_uidx
  on job_applications (user_id, external_job_id);

create index if not exists job_applications_user_status_idx
  on job_applications (user_id, status);

alter table job_applications enable row level security;

-- Owner-only access (mirrors the cvs policies).
drop policy if exists "own job_applications - select" on job_applications;
create policy "own job_applications - select" on job_applications
  for select using (auth.uid() = user_id);

drop policy if exists "own job_applications - insert" on job_applications;
create policy "own job_applications - insert" on job_applications
  for insert with check (auth.uid() = user_id);

drop policy if exists "own job_applications - update" on job_applications;
create policy "own job_applications - update" on job_applications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own job_applications - delete" on job_applications;
create policy "own job_applications - delete" on job_applications
  for delete using (auth.uid() = user_id);

-- Verify:
-- select status, count(*) from job_applications group by status;
