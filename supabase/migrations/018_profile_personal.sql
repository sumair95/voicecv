-- 018_profile_personal.sql
-- Reusable personal details on the user profile, seeded from the user's first
-- CV and editable on the Profile tab. full_name + email already exist on
-- profiles (schema.sql); this adds the rest. Idempotent.

alter table public.profiles add column if not exists nationality text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists phone text;
