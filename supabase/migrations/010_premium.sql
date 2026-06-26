-- 010_premium.sql
-- Premium pack ($5 one-time): grants 2 premium-template CV unlocks + 1 cover
-- letter. Credits live on the profile; per-CV unlock + the generated cover
-- letter live on the CV row. Purchases are recorded for webhook idempotency.

-- ── Credits on the profile ──────────────────────────────────────────
alter table profiles add column if not exists premium_cv_credits int not null default 0;
alter table profiles add column if not exists cover_letter_credits int not null default 0;

-- ── Per-CV premium state ────────────────────────────────────────────
alter table cvs add column if not exists premium_unlocked boolean not null default false;
alter table cvs add column if not exists cover_letter text;

-- ── Purchases (idempotency + audit). One row per Stripe checkout session ──
create table if not exists purchases (
  id text primary key,                -- stripe checkout session id
  user_id uuid references profiles(id) on delete cascade,
  amount_total int,                   -- cents
  currency text,
  created_at timestamptz default timezone('utc', now())
);
alter table purchases enable row level security;
drop policy if exists "own purchases" on purchases;
create policy "own purchases" on purchases for select using (auth.uid() = user_id);
-- Inserts are performed by the webhook with the service-role key (bypasses RLS).

-- ── Atomic credit consumption (only decrement when a credit exists) ──
-- These are SECURITY DEFINER (they write to profiles past RLS) so they derive
-- the user from auth.uid() of the calling JWT — never a passed-in id — so a
-- client can't spend or unlock on behalf of someone else.
-- Unlock a CV for premium templates. Returns true if the CV is (now) unlocked.
-- Idempotent: an already-unlocked CV costs nothing.
create or replace function consume_premium_cv_credit(p_cv uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  if exists (
    select 1 from cvs where id = p_cv and user_id = uid and premium_unlocked
  ) then
    return true;
  end if;

  update profiles
    set premium_cv_credits = premium_cv_credits - 1
    where id = uid and premium_cv_credits > 0;
  if not found then
    return false;
  end if;

  update cvs set premium_unlocked = true where id = p_cv and user_id = uid;
  return true;
end;
$$;

-- Consume one cover-letter credit. Returns true if a credit was spent.
create or replace function consume_cover_letter_credit()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return false;
  end if;

  update profiles
    set cover_letter_credits = cover_letter_credits - 1
    where id = uid and cover_letter_credits > 0;
  return found;
end;
$$;

-- Verify:
-- select premium_cv_credits, cover_letter_credits from profiles where id = auth.uid();
