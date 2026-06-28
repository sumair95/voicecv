-- 013_events.sql
-- Lightweight first-party analytics. Every funnel step writes a row here; the
-- funnel is read with SQL (see ANALYTICS.md). No third-party tracker, no PII
-- beyond the user id — privacy-friendly and owned by us.

create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  event text not null,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists events_event_created_idx on events (event, created_at);
create index if not exists events_user_idx on events (user_id);

alter table events enable row level security;

-- Clients may only INSERT their own events. Nobody can SELECT via the API —
-- analytics is read with the service role / SQL editor (owner only).
drop policy if exists "insert own events" on events;
create policy "insert own events" on events
  for insert
  with check (user_id is null or auth.uid() = user_id);

-- Verify:
-- select event, count(*) from events group by event order by 2 desc;
