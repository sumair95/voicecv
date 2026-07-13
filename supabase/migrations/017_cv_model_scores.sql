-- 017_cv_model_scores.sql
-- Multi-model CV generation: log each competing model's blind quality score
-- (0–10) per CV, so we can validate which model performs best over time. The
-- CV shown to the user is always the highest-scored one (won = true).
--
-- Only written when CV_MULTI_MODEL is enabled. Idempotent.

create table if not exists public.cv_model_scores (
  id         uuid primary key default gen_random_uuid(),
  cv_id      uuid not null references public.cvs(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  model      text not null,       -- e.g. "claude-sonnet-4-6", "gpt-4o"
  score      int not null,        -- blind judge score, 0–10
  won        boolean not null default false, -- was this the CV shown to the user?
  created_at timestamptz not null default now()
);

alter table public.cv_model_scores enable row level security;

drop policy if exists "own cv_model_scores" on public.cv_model_scores;
create policy "own cv_model_scores" on public.cv_model_scores
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists cv_model_scores_model_idx on public.cv_model_scores (model);

-- Validation query — average score + win-rate per model:
--   select model,
--          round(avg(score), 2) as avg_score,
--          count(*) as generations,
--          round(100.0 * count(*) filter (where won) / count(*), 1) as win_pct
--   from public.cv_model_scores group by model order by avg_score desc;
