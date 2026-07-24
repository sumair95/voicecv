-- 023_lock_entitlement_columns.sql
--
-- SECURITY FIX (C1) — entitlement columns were client-writable.
--
-- The RLS policies are `for all using (auth.uid() = ...)`, which includes
-- UPDATE. Supabase grants ALL on public tables to `anon` + `authenticated` by
-- default, and the browser holds an authenticated session, so any logged-in
-- user could run:
--
--   supabase.from('profiles').update({ premium_cv_credits: 999, cvs_created: 0 })
--   supabase.from('cvs').update({ premium_unlocked: true })
--
-- ...and grant themselves unlimited premium without ever touching Stripe. The
-- consume_*_credit() RPCs are correct but were simply bypassed.
--
-- Fix: RLS decides WHICH ROWS you may touch; column grants decide WHICH COLUMNS.
-- We need both. Note that a column-level REVOKE is a no-op against a table-wide
-- grant, so we drop the table grant and re-grant only the safe columns.
--
-- SECURITY DEFINER functions (consume_premium_cv_credit, consume_cover_letter_credit,
-- consume_formal_photo_credit, increment_cvs_created, handle_new_user) run as the
-- function owner, so they are unaffected and keep working. The service-role key
-- (Stripe webhook, admin client) bypasses grants entirely.
--
-- Idempotent — safe to run more than once.

-- ── profiles ────────────────────────────────────────────────────────
-- Writable by the user: their own contact/display details only.
-- Locked (server-only): premium_cv_credits, cover_letter_credits, cv_credits,
-- formal_photo_credits, cvs_created, photo_url, photo_formal_url, id, created_at.
-- photo_url/photo_formal_url are already written exclusively by the photo routes
-- with the service-role client, so locking them costs nothing.

revoke update on public.profiles from authenticated, anon;
revoke insert on public.profiles from authenticated, anon;  -- rows come from the
                                                            -- handle_new_user trigger

grant update (
  full_name,
  email,
  phone,
  language,
  city,
  country,
  nationality,
  photo_choice
) on public.profiles to authenticated;

-- ── cvs ─────────────────────────────────────────────────────────────
-- Writable by the user: CV content. Locked: premium_unlocked,
-- cover_letter_unlocked (entitlement), id, user_id, created_at.
--
-- INSERT is granted per-column too — otherwise a crafted insert could set
-- premium_unlocked = true at creation time and walk straight past the paywall.

revoke update on public.cvs from authenticated, anon;
revoke insert on public.cvs from authenticated, anon;

grant update (
  title,
  cv_data,
  template,
  transcript,
  status,
  language,
  cover_letter,
  generated_cv_data,
  generated_by,
  updated_at
) on public.cvs to authenticated;

grant insert (
  user_id,
  title,
  cv_data,
  template,
  transcript,
  status,
  language,
  cover_letter,
  generated_cv_data,
  generated_by,
  created_at,
  updated_at
) on public.cvs to authenticated;

-- SELECT and DELETE are deliberately left alone: users must still be able to
-- read their credit balances (the dashboard displays them) and delete their CVs.

-- ── Verify ──────────────────────────────────────────────────────────
-- Should return ONLY the safe columns listed above:
--
--   select table_name, column_name, privilege_type
--   from information_schema.column_privileges
--   where grantee = 'authenticated'
--     and table_name in ('profiles', 'cvs')
--     and privilege_type in ('UPDATE', 'INSERT')
--   order by table_name, privilege_type, column_name;
--
-- And this, run from the browser as a logged-in user, must now fail with
-- "permission denied for table profiles":
--
--   await supabase.from('profiles')
--     .update({ premium_cv_credits: 999 }).eq('id', MY_USER_ID);
