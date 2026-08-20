-- 028_jd_match.sql
-- JD Match — paste or upload a job description, score the selected CV against
-- it, and (behind the premium paywall) apply a rewritten Summary + current role
-- as a new tailored copy of the CV.
--
-- Why the analysis is persisted at all: the scoring call is the most expensive
-- request in the app (Opus + adaptive thinking). The free half of the result is
-- shown immediately; the paid half (`draft`) is held here so that unlocking it
-- later is a credit charge and a row read, not a second model call.

create table if not exists jd_matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The CV that was scored. Nullable so the analysis survives CV deletion.
  cv_id uuid references cvs (id) on delete set null,
  -- The tailored copy created when the user applies the rewrite (set on unlock).
  tailored_cv_id uuid references cvs (id) on delete set null,

  -- Snapshot of the posting, so a re-run or a history view needs no re-upload.
  job_title text not null default '',
  company text not null default '',
  jd_text text not null default '',

  -- Free half of the result — safe to show before payment.
  overall_score int not null default 0,
  projected_score int,
  analysis jsonb not null default '{}'::jsonb,

  -- Paid half — the rewritten summary / headline / current role / skill order.
  -- Never selectable by the browser (see the column grants below); it reaches
  -- the client only through /api/jobs/jd-match/apply after a credit is spent.
  draft jsonb not null default '{}'::jsonb,
  unlocked boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists jd_matches_user_created_idx
  on jd_matches (user_id, created_at desc);

alter table jd_matches enable row level security;

-- Owner-only reads and deletes. Writes are performed exclusively by the server
-- with the service-role client: `draft` and `unlocked` are entitlement-bearing,
-- and migration 023 is the standing lesson on what happens when the browser can
-- write those columns.
drop policy if exists "own jd_matches - select" on jd_matches;
create policy "own jd_matches - select" on jd_matches
  for select using (auth.uid() = user_id);

drop policy if exists "own jd_matches - delete" on jd_matches;
create policy "own jd_matches - delete" on jd_matches
  for delete using (auth.uid() = user_id);

-- RLS decides WHICH ROWS; column grants decide WHICH COLUMNS. Both are needed.
revoke insert, update on public.jd_matches from authenticated, anon;
revoke select on public.jd_matches from authenticated, anon;

-- Everything except `draft` — a logged-in user may read their own scores and
-- gap analysis, but not the rewrite they have not paid for.
grant select (
  id,
  user_id,
  cv_id,
  tailored_cv_id,
  job_title,
  company,
  jd_text,
  overall_score,
  projected_score,
  analysis,
  unlocked,
  created_at
) on public.jd_matches to authenticated;

grant delete on public.jd_matches to authenticated;

-- Verify:
--   select job_title, overall_score, projected_score, unlocked
--   from jd_matches where user_id = auth.uid() order by created_at desc;
--
-- And this, run from the browser as a logged-in user, must fail with
-- "permission denied for table jd_matches":
--   await supabase.from('jd_matches').select('draft');
