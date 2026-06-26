-- 009_simple_achievements.sql
-- The "Key Achievements" question used to ask for a full STAR story
-- (Situation/Task/Action/Result). People just want to list achievements or
-- awards (e.g. "Employee of the Month"), so reword Q9 in every language to
-- ask for a simple list. Idempotent: scoped to field_key = 'achievement'.

update questions set question_text =
  'What achievements or awards are you proud of? For example, employee of the month, top performer, or completing a big project. List as many as you like.'
  where field_key = 'achievement' and language = 'en';

update questions set question_text =
  'Di quali risultati o riconoscimenti sei orgoglioso? Per esempio, dipendente del mese, miglior collaboratore o aver completato un grande progetto. Elencane quanti vuoi.'
  where field_key = 'achievement' and language = 'it';

update questions set question_text =
  'ما الإنجازات أو الجوائز التي تفخر بها؟ مثلاً موظف الشهر، الأفضل أداءً، أو إنجاز مشروع كبير. اذكر ما تشاء منها.'
  where field_key = 'achievement' and language = 'ar';

update questions set question_text =
  'آپ کو کن کامیابیوں یا انعامات پر فخر ہے؟ مثلاً ملازمِ ماہ، بہترین کارکردگی، یا کوئی بڑا منصوبہ مکمل کرنا۔ جتنی چاہیں بتائیں۔'
  where field_key = 'achievement' and language = 'ur';

-- Verify: 4 rows (one per language).
-- select language, question_text from questions where field_key = 'achievement';
