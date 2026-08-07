-- 027_private_avatars.sql
-- H4 — face photos were permanently public.
--
-- Migration 019 created `avatars` as a PUBLIC bucket, reasoning that paths are
-- namespaced by user id and writes are owner-only, so only direct-URL reads are
-- exposed. That reasoning undersells the risk for this product: the objects are
-- headshots of a migrant-worker user base, the URL is a permanent
-- unauthenticated handle on that person's face, it survives "remove photo" in
-- any copy that leaked, and it is emitted into CV JSON that gets shared around.
--
-- This flips the bucket private. Reads now go through short-lived signed URLs
-- minted server-side for the owner (see lib/photo/storage.ts).
--
-- Idempotent. No data migration is needed: stored values may be legacy public
-- URLs, and `avatarPath()` parses those back to the object path.

update storage.buckets set public = false where id = 'avatars';

-- Owner-only read. The app mints signed URLs with the service-role key (which
-- bypasses RLS), so this policy is not on the hot path — it is the backstop that
-- keeps one authenticated user from reading another's object directly.
drop policy if exists "avatars read own" on storage.objects;
create policy "avatars read own" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Verification:
--   select id, public from storage.buckets where id = 'avatars';  -- public = false
--   -- and a previously-working public URL must now return 400/404:
--   -- https://<project>.supabase.co/storage/v1/object/public/avatars/<uid>/<file>
