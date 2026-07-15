-- 019_profile_photo.sql
-- Profile photo: the user uploads/captures a headshot (photo_url), optionally
-- converts it to a "formal" AI-enhanced version (photo_formal_url, a paid
-- feature), and chooses which one their CV uses (photo_choice). Idempotent.

alter table public.profiles add column if not exists photo_url text;
alter table public.profiles add column if not exists photo_formal_url text;
alter table public.profiles
  add column if not exists photo_choice text not null default 'original'; -- 'original' | 'formal'

-- Public bucket so the headshot can be embedded in the CV preview + PDF by URL.
-- Paths are namespaced by user id and writes are owner-only (below), so nothing
-- is listable/writable across users; only direct-URL reads are public.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars upload own" on storage.objects;
create policy "avatars upload own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars update own" on storage.objects;
create policy "avatars update own" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars delete own" on storage.objects;
create policy "avatars delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
