-- VoiceCV database schema
-- Run this in the Supabase SQL Editor for your project.

create table if not exists profiles (
  id uuid references auth.users on delete cascade,
  full_name text,
  email text,
  language text default 'en',
  created_at timestamp with time zone default timezone('utc', now()),
  primary key (id)
);

create table if not exists cvs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text,
  audio_url text,
  transcript text,
  cv_data jsonb,
  status text default 'processing',
  created_at timestamp with time zone default timezone('utc', now()),
  updated_at timestamp with time zone default timezone('utc', now())
);

create table if not exists questions (
  id uuid default gen_random_uuid() primary key,
  language text default 'en',
  order_index int,
  question_text text,
  field_key text
);

insert into questions (language, order_index, question_text, field_key) values
  ('en', 1, 'What is your full name and what city do you live in?', 'personal'),
  ('en', 2, 'What jobs have you done? Include company name and duration.', 'experience'),
  ('en', 3, 'What skills do you have? e.g. driving, cooking, languages.', 'skills'),
  ('en', 4, 'What is your highest education level, where and what did you study?', 'education'),
  ('en', 5, 'What kind of job are you looking for and what are your goals?', 'objective'),
  ('ar', 1, 'ما اسمك الكامل وفي أي مدينة تسكن؟', 'personal'),
  ('ar', 2, 'ما هي الوظائف التي عملت بها سابقاً؟ اذكر اسم الشركة ومدة العمل.', 'experience'),
  ('ar', 3, 'ما هي مهاراتك؟ مثلاً: القيادة، الطبخ، خدمة العملاء، اللغات.', 'skills'),
  ('ar', 4, 'ما هو أعلى مستوى تعليمي حصلت عليه وأين درست؟', 'education'),
  ('ar', 5, 'ما نوع الوظيفة التي تبحث عنها وما هي أهدافك المهنية؟', 'objective')
on conflict do nothing;

alter table profiles enable row level security;
alter table cvs enable row level security;

drop policy if exists "own profile" on profiles;
drop policy if exists "own cvs" on cvs;
create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own cvs" on cvs for all using (auth.uid() = user_id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for recordings
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;

drop policy if exists "users can upload recordings" on storage.objects;
drop policy if exists "users can read own recordings" on storage.objects;
create policy "users can upload recordings"
  on storage.objects for insert
  with check (bucket_id = 'recordings' and auth.uid() = owner);
create policy "users can read own recordings"
  on storage.objects for select
  using (bucket_id = 'recordings' and auth.uid() = owner);
