-- VoiceCV migration 004 — update Q1 to ask for city + country (was: city only).
-- Run in Supabase SQL Editor after migrations 002 and 003.
-- Idempotent.

begin;

update questions
set question_text = 'Please tell us your full name, nationality, the city and country you live in, and your mobile number and email if you have one.'
where language = 'en' and order_index = 1;

update questions
set question_text = 'من فضلك أخبرنا باسمك الكامل، جنسيتك، المدينة والدولة التي تسكن فيها، ورقم جوالك وبريدك الإلكتروني إن وجد.'
where language = 'ar' and order_index = 1;

update questions
set question_text = 'براہ کرم ہمیں اپنا پورا نام، قومیت، جس شہر اور ملک میں آپ رہتے ہیں، اپنا موبائل نمبر اور ای میل بتائیں اگر ہو تو۔'
where language = 'ur' and order_index = 1;

commit;

-- Verify
select language, question_text from questions where order_index = 1 order by language;
