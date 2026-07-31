-- 024_rate_limits.sql
--
-- Durable, cluster-safe rate limiting (H2).
--
-- The app-level limiter was an in-memory Map, so each server instance had its
-- own counters — on any horizontally scaled or serverless deploy an attacker got
-- `max × instances` per window and could rotate freely. That left the paid AI
-- calls (Whisper, Claude, GPT-4o, Gemini, remove.bg) without an effective cap.
--
-- This moves the counter into Postgres, shared by every instance, incremented
-- atomically. lib/rate-limit.ts calls `rate_limit_take` and falls back to the
-- in-memory limiter only if this RPC is unavailable, so deploying the code
-- before running this migration degrades gracefully rather than breaking.
--
-- Idempotent.

create table if not exists public.rate_limits (
  key       text primary key,
  count     int not null,
  reset_at  timestamptz not null
);

-- No RLS policies: only the service-role client (the limiter) and this
-- SECURITY DEFINER function touch it. Enable RLS so nothing else can.
alter table public.rate_limits enable row level security;

-- Atomic "take one token". Increments the window counter for `p_key`, resetting
-- it when the window has elapsed, and reports whether the caller is under the
-- cap. The ON CONFLICT DO UPDATE takes a row lock, so concurrent calls for the
-- same key can't lose an increment.
create or replace function public.rate_limit_take(
  p_key text,
  p_max int,
  p_window_ms int
)
returns table(allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  win interval := make_interval(secs => p_window_ms / 1000.0);
  rec public.rate_limits;
begin
  insert into public.rate_limits(key, count, reset_at)
    values (p_key, 1, now_ts + win)
  on conflict (key) do update
    set count = case when public.rate_limits.reset_at <= now_ts then 1
                     else public.rate_limits.count + 1 end,
        reset_at = case when public.rate_limits.reset_at <= now_ts then now_ts + win
                        else public.rate_limits.reset_at end
  returning * into rec;

  allowed := rec.count <= p_max;
  remaining := greatest(p_max - rec.count, 0);
  reset_at := rec.reset_at;
  return next;
end;
$$;

-- Housekeeping: an occasional sweep of expired rows keeps the table tiny.
-- (Optional — safe to schedule from pg_cron, or ignore; rows are bounded by
-- users × routes anyway.)
--   delete from public.rate_limits where reset_at < now() - interval '1 hour';

-- Verify:
--   select * from public.rate_limit_take('test:demo', 3, 60000);
--   -- run 4×: first 3 allowed=true, 4th allowed=false.
