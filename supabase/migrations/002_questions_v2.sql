-- VoiceCV migration 002 — replace question set with v2 (9 questions × 4 languages).
-- Run this in the Supabase SQL Editor on an EXISTING project that has v1 questions seeded.
-- Safe to re-run (idempotent: it clears the questions table first, then re-seeds).

begin;

delete from questions;

insert into questions (language, order_index, question_text, field_key) values
-- English
('en', 1, 'Please tell us your full name, nationality, the city you live in, and your mobile number and email if you have one.', 'personal'),
('en', 2, 'Tell us about your most recent or current job — the company name, your job title, how long you worked there.', 'recent_job'),
('en', 3, 'List any previous roles, even short-term or casual work, and how long you did them.', 'previous_roles'),
('en', 4, 'What specific skills, tools, equipment, licences, or software do you know how to use? Be as specific as possible.', 'skills'),
('en', 5, 'Which languages do you speak, read, or write? For each one, are you a beginner, conversational, or fluent?', 'spoken_languages'),
('en', 6, 'What is your highest level of education, where did you study?', 'education'),
('en', 7, 'Have you done any certificates or training courses?', 'certificates'),
('en', 8, 'What are your hobbies?', 'hobbies'),
('en', 9, 'Do you want to describe a work achievement using the STAR method? Tell us the Situation, Task, Action, and Result.', 'achievement'),

-- Arabic
('ar', 1, 'من فضلك أخبرنا باسمك الكامل، جنسيتك، المدينة التي تسكن فيها، ورقم جوالك وبريدك الإلكتروني إن وجد.', 'personal'),
('ar', 2, 'أخبرنا عن آخر وظيفة لك — اسم الشركة، مسمى وظيفتك، وكم مدة عملك هناك.', 'recent_job'),
('ar', 3, 'اذكر أي وظائف سابقة، حتى لو كانت مؤقتة أو غير رسمية، وكم المدة لكل منها.', 'previous_roles'),
('ar', 4, 'ما هي المهارات والأدوات والمعدات والرخص أو البرامج التي تتقن استخدامها؟ كن محدداً.', 'skills'),
('ar', 5, 'ما اللغات التي تتحدثها أو تقرأها أو تكتبها؟ هل مستواك مبتدئ أم متوسط أم متقدم؟', 'spoken_languages'),
('ar', 6, 'ما هو أعلى مستوى تعليمي حصلت عليه، وأين درست؟', 'education'),
('ar', 7, 'هل حصلت على أي شهادات أو أتممت دورات تدريبية؟', 'certificates'),
('ar', 8, 'ما هي هواياتك واهتماماتك في وقت الفراغ؟', 'hobbies'),
('ar', 9, 'هل تريد وصف إنجاز باستخدام أسلوب STAR؟ الموقف، المهمة، الإجراء، والنتيجة.', 'achievement'),

-- Urdu
('ur', 1, 'براہ کرم ہمیں اپنا پورا نام، قومیت، جس شہر میں آپ رہتے ہیں، اپنا موبائل نمبر اور ای میل بتائیں اگر ہو تو۔', 'personal'),
('ur', 2, 'ہمیں اپنی سب سے حالیہ نوکری کے بارے میں بتائیں — کمپنی کا نام، آپ کی پوزیشن، اور کتنے عرصے کام کیا۔', 'recent_job'),
('ur', 3, 'اپنی کوئی بھی پرانی ملازمتیں بتائیں، چاہے عارضی ہوں، اور ہر ایک میں کتنا عرصہ کام کیا۔', 'previous_roles'),
('ur', 4, 'آپ کون سی مخصوص مہارتیں، آلات، لائسنس یا سافٹ ویئر جانتے ہیں؟ تفصیل سے بتائیں۔', 'skills'),
('ur', 5, 'آپ کون سی زبانیں بول، پڑھ یا لکھ سکتے ہیں؟ ہر زبان میں آپ کا معیار کیا ہے؟', 'spoken_languages'),
('ur', 6, 'آپ کی سب سے اعلیٰ تعلیمی قابلیت کیا ہے اور آپ نے کہاں پڑھا؟', 'education'),
('ur', 7, 'کیا آپ نے کوئی سرٹیفکیٹ یا تربیتی کورس کیا ہے؟', 'certificates'),
('ur', 8, 'آپ کے مشاغل کیا ہیں؟ فارغ وقت میں کیا کرتے ہیں؟', 'hobbies'),
('ur', 9, 'کیا آپ STAR طریقے سے کوئی کامیابی بیان کرنا چاہتے ہیں؟ صورتحال، کام، اقدام اور نتیجہ بتائیں۔', 'achievement'),

-- Hindi (Q6-Q9 translated by Claude — adjust if you prefer different wording)
('hi', 1, 'कृपया हमें अपना पूरा नाम, राष्ट्रीयता, आप जिस शहर में रहते हैं, अपना मोबाइल नंबर और ईमेल बताएं।', 'personal'),
('hi', 2, 'हमें अपनी सबसे हालिया नौकरी के बारे में बताएं — कंपनी का नाम, आपका पद, और कितने समय काम किया।', 'recent_job'),
('hi', 3, 'अपनी कोई भी पुरानी नौकरियाँ बताएं, चाहे अस्थायी हों, और हर एक में कितने समय काम किया।', 'previous_roles'),
('hi', 4, 'आप कौन सी विशेष कौशल, उपकरण, लाइसेंस या सॉफ़्टवेयर जानते हैं? विस्तार से बताएं।', 'skills'),
('hi', 5, 'आप कौन सी भाषाएं बोल, पढ़ या लिख सकते हैं? हर भाषा में आपका स्तर क्या है?', 'spoken_languages'),
('hi', 6, 'आपकी सबसे उच्च शिक्षा क्या है, आपने कहाँ पढ़ाई की?', 'education'),
('hi', 7, 'क्या आपने कोई सर्टिफिकेट या प्रशिक्षण कोर्स किया है?', 'certificates'),
('hi', 8, 'आपके शौक़ क्या हैं? खाली समय में क्या करते हैं?', 'hobbies'),
('hi', 9, 'क्या आप STAR तरीक़े से कोई कार्य उपलब्धि बताना चाहेंगे? स्थिति, कार्य, क्रिया और परिणाम बताएं।', 'achievement');

commit;
