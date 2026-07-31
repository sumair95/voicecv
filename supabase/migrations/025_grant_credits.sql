-- 025_grant_credits.sql
--
-- Atomic credit grant for the Stripe webhook (M3).
--
-- The webhook previously did read-modify-write on the profile's credit columns
-- (SELECT current value → add → UPDATE). Two concurrent
-- checkout.session.completed events for the same user (a double purchase, or a
-- Stripe retry storm) could interleave and lose a grant. The per-session
-- idempotency insert protects against duplicates of the SAME session, not
-- concurrency across different sessions.
--
-- This RPC does the increments in a single atomic UPDATE, so grants can't be
-- lost. It's called by the webhook with the service-role key AFTER the
-- idempotency insert succeeds. Amounts are per-pack (see lib/premium.ts).
--
-- Idempotent.

create or replace function public.grant_credits(
  p_user uuid,
  p_cv int default 0,
  p_premium_cv int default 0,
  p_cover_letter int default 0,
  p_formal_photo int default 0
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles
     set cv_credits          = cv_credits          + coalesce(p_cv, 0),
         premium_cv_credits   = premium_cv_credits   + coalesce(p_premium_cv, 0),
         cover_letter_credits = cover_letter_credits + coalesce(p_cover_letter, 0),
         formal_photo_credits = formal_photo_credits + coalesce(p_formal_photo, 0)
   where id = p_user;
$$;

-- Not granted to authenticated/anon: only the service-role webhook calls it.

-- Verify:
--   select public.grant_credits('<uuid>', 3, 0, 0, 0);
--   select cv_credits from profiles where id = '<uuid>';
