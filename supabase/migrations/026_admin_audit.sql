-- 026_admin_audit.sql
--
-- Durable audit trail for admin actions (L6).
--
-- The /admin comp + free-mode controls previously only wrote to `logger.info`,
-- which isn't durable or queryable. free_mode toggles paid features for EVERY
-- user (i.e. it moves revenue), so those actions need a real record.
--
-- No RLS policies → only the service-role admin client writes here. Idempotent.

create table if not exists public.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  actor      text not null,          -- admin email that performed the action
  action     text not null,          -- e.g. 'freemode', 'comp_toggle', 'comp_add'
  detail     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.admin_audit enable row level security;

create index if not exists admin_audit_created_idx
  on public.admin_audit (created_at desc);

-- Verify:
--   select created_at, actor, action, detail
--   from public.admin_audit order by created_at desc limit 20;
