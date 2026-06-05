-- VoiceCV database schema (current = v2 question set, 9 questions × 4 languages).
-- Run this in the Supabase SQL Editor for a NEW project.
-- For existing projects upgrading from v1, use migrations/002_questions_v2.sql instead.

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
  template text not null default 'modern',
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

-- Seed the v2 question set (9 questions × 4 languages = 36 rows)
delete from questions;
insert into questions (language, order_index, question_text, field_key) values
-- English
('en', 1, 'Please tell us your full name, nationality, the city and country you live in, and your mobile number and email if you have one.', 'personal'),
('en', 2, 'Tell us about your most recent or current job — the company name, your job title, how long you worked there.', 'recent_job'),
('en', 3, 'List any previous roles, even short-term or casual work, and how long you did them.', 'previous_roles'),
('en', 4, 'What specific skills, tools, equipment, licences, or software do you know how to use? Be as specific as possible.', 'skills'),
('en', 5, 'Which languages do you speak, read, or write? For each one, are you a beginner, conversational, or fluent?', 'spoken_languages'),
('en', 6, 'What is your highest level of education, where did you study?', 'education'),
('en', 7, 'Have you done any certificates or training courses?', 'certificates'),
('en', 8, 'What are your hobbies?', 'hobbies'),
('en', 9, 'Do you want to describe a work achievement using the STAR method? Tell us the Situation, Task, Action, and Result.', 'achievement'),
-- Arabic
('ar', 1, 'من فضلك أخبرنا باسمك الكامل، جنسيتك، المدينة والدولة التي تسكن فيها، ورقم جوالك وبريدك الإلكتروني إن وجد.', 'personal'),
('ar', 2, 'أخبرنا عن آخر وظيفة لك — اسم الشركة، مسمى وظيفتك، وكم مدة عملك هناك.', 'recent_job'),
('ar', 3, 'اذكر أي وظائف سابقة، حتى لو كانت مؤقتة أو غير رسمية، وكم المدة لكل منها.', 'previous_roles'),
('ar', 4, 'ما هي المهارات والأدوات والمعدات والرخص أو البرامج التي تتقن استخدامها؟ كن محدداً.', 'skills'),
('ar', 5, 'ما اللغات التي تتحدثها أو تقرأها أو تكتبها؟ هل مستواك مبتدئ أم متوسط أم متقدم؟', 'spoken_languages'),
('ar', 6, 'ما هو أعلى مستوى تعليمي حصلت عليه، وأين درست؟', 'education'),
('ar', 7, 'هل حصلت على أي شهادات أو أتممت دورات تدريبية؟', 'certificates'),
('ar', 8, 'ما هي هواياتك واهتماماتك في وقت الفراغ؟', 'hobbies'),
('ar', 9, 'هل تريد وصف إنجاز باستخدام أسلوب STAR؟ الموقف، المهمة، الإجراء، والنتيجة.', 'achievement'),
-- Urdu
('ur', 1, 'براہ کرم ہمیں اپنا پورا نام، قومیت، جس شہر اور ملک میں آپ رہتے ہیں، اپنا موبائل نمبر اور ای میل بتائیں اگر ہو تو۔', 'personal'),
('ur', 2, 'ہمیں اپنی سب سے حالیہ نوکری کے بارے میں بتائیں — کمپنی کا نام، آپ کی پوزیشن، اور کتنے عرصے کام کیا۔', 'recent_job'),
('ur', 3, 'اپنی کوئی بھی پرانی ملازمتیں بتائیں، چاہے عارضی ہوں، اور ہر ایک میں کتنا عرصہ کام کیا۔', 'previous_roles'),
('ur', 4, 'آپ کون سی مخصوص مہارتیں، آلات، لائسنس یا سافٹ ویئر جانتے ہیں؟ تفصیل سے بتائیں۔', 'skills'),
('ur', 5, 'آپ کون سی زبانیں بول، پڑھ یا لکھ سکتے ہیں؟ ہر زبان میں آپ کا معیار کیا ہے؟', 'spoken_languages'),
('ur', 6, 'آپ کی سب سے اعلیٰ تعلیمی قابلیت کیا ہے اور آپ نے کہاں پڑھا؟', 'education'),
('ur', 7, 'کیا آپ نے کوئی سرٹیفکیٹ یا تربیتی کورس کیا ہے؟', 'certificates'),
('ur', 8, 'آپ کے مشاغل کیا ہیں؟ فارغ وقت میں کیا کرتے ہیں؟', 'hobbies'),
('ur', 9, 'کیا آپ STAR طریقے سے کوئی کامیابی بیان کرنا چاہتے ہیں؟ صورتحال، کام، اقدام اور نتیجہ بتائیں۔', 'achievement');

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
