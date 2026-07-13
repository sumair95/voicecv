-- 016_cv_edit_learning.sql
-- Capture the AI's ORIGINAL CV output separately from the user-edited version,
-- and log (generated -> final) pairs so future generations can learn from the
-- best human-approved CVs for the same / similar role.
--
-- Why: today the debounced editor overwrites cvs.cv_data on the first edit, so
-- the AI's original output is lost. We preserve it in generated_cv_data (set
-- once at generation, never touched by edits) and record the human-approved
-- final in cv_edit_events, which becomes the exemplar pool for few-shot prompts.
--
-- Idempotent — safe to run more than once.

-- 1. Immutable snapshot of the AI's original output + which model produced it.
alter table public.cvs add column if not exists generated_cv_data jsonb;
alter table public.cvs add column if not exists generated_by text;

-- 2. One row per CV (upserted): the generated vs. human-approved final pair.
create table if not exists public.cv_edit_events (
  cv_id           uuid primary key references public.cvs(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text,              -- most-recent job role, for similar-role retrieval
  output_language text,
  model           text,             -- model that produced generated_cv
  generated_cv    jsonb not null,   -- AI original
  final_cv        jsonb not null,   -- human-approved version
  edited          boolean not null default false, -- did the human change anything?
  updated_at      timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table public.cv_edit_events enable row level security;

drop policy if exists "own cv_edit_events" on public.cv_edit_events;
create policy "own cv_edit_events" on public.cv_edit_events
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Retrieval index: find approved exemplars by role + output language.
create index if not exists cv_edit_events_role_idx
  on public.cv_edit_events (output_language, role);

-- Verify:
--   select output_language, count(*) filter (where edited) as edited, count(*)
--   from public.cv_edit_events group by output_language;
