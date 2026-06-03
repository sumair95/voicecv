import type { Language } from "@/types/cv";

export const LANGUAGES: {
  code: Language;
  label: string;
  english: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English", english: "English", dir: "ltr" },
  { code: "ar", label: "العربية", english: "Arabic", dir: "rtl" },
  { code: "ur", label: "اردو", english: "Urdu", dir: "rtl" },
];

export function dirFor(lang: Language): "ltr" | "rtl" {
  return lang === "ar" || lang === "ur" ? "rtl" : "ltr";
}

type Entry = { en: string; ar: string; ur: string };
type Dict = Record<string, Entry>;

export const t: Dict = {
  // Landing
  "landing.tagline": {
    en: "Speak. We Write. You Succeed.",
    ar: "تحدّث. نحن نكتب. أنت تنجح.",
    ur: "بولیں۔ ہم لکھیں گے۔ آپ کامیاب ہوں گے۔",
  },
  "landing.subhead": {
    en: "Turn a 5-minute voice recording into a professional CV — free, in English, Arabic, or Urdu.",
    ar: "حوّل تسجيلاً صوتياً مدته ٥ دقائق إلى سيرة ذاتية احترافية — مجاناً، بالإنجليزية أو العربية أو الأردية.",
    ur: "5 منٹ کی آواز کی ریکارڈنگ کو پیشہ ورانہ CV میں تبدیل کریں — مفت، انگریزی، عربی یا اردو میں۔",
  },
  "landing.cta.primary": {
    en: "Create My CV Free",
    ar: "أنشئ سيرتي مجاناً",
    ur: "میرا CV مفت بنائیں",
  },
  "landing.cta.secondary": {
    en: "See Demo",
    ar: "شاهد العرض",
    ur: "ڈیمو دیکھیں",
  },
  "landing.stats.cvs": {
    en: "CVs Generated",
    ar: "سيرة ذاتية تم إنشاؤها",
    ur: "CVs بنائے گئے",
  },
  "landing.stats.minutes": {
    en: "Minutes to Complete",
    ar: "دقائق للإنجاز",
    ur: "مکمل کرنے کے منٹ",
  },
  "landing.stats.languages": {
    en: "Languages Supported",
    ar: "لغات مدعومة",
    ur: "زبانیں دستیاب",
  },
  "landing.stats.free": { en: "Free", ar: "مجاني", ur: "مفت" },

  "landing.steps.title": {
    en: "How it works",
    ar: "كيف يعمل",
    ur: "یہ کیسے کام کرتا ہے",
  },
  "landing.step1.title": {
    en: "Answer Simple Voice Questions",
    ar: "أجب على أسئلة صوتية بسيطة",
    ur: "آسان آواز کے سوالات کا جواب دیں",
  },
  "landing.step1.desc": {
    en: "Speak naturally in your own language. No typing.",
    ar: "تحدث بلغتك بطريقة طبيعية. لا حاجة للكتابة.",
    ur: "اپنی زبان میں قدرتی طور پر بولیں۔ کوئی ٹائپنگ نہیں۔",
  },
  "landing.step2.title": {
    en: "AI Writes Your CV",
    ar: "الذكاء الاصطناعي يكتب سيرتك",
    ur: "AI آپ کا CV لکھتا ہے",
  },
  "landing.step2.desc": {
    en: "We turn your answers into a polished, professional CV.",
    ar: "نحول إجاباتك إلى سيرة ذاتية احترافية ومنسقة.",
    ur: "ہم آپ کے جوابات کو ایک پیشہ ورانہ CV میں تبدیل کرتے ہیں۔",
  },
  "landing.step3.title": {
    en: "Download & Apply",
    ar: "حمّل وتقدّم",
    ur: "ڈاؤن لوڈ کریں اور درخواست دیں",
  },
  "landing.step3.desc": {
    en: "Get your CV as a PDF and start applying for jobs.",
    ar: "احصل على سيرتك بصيغة PDF وابدأ بالتقديم على الوظائف.",
    ur: "اپنا CV PDF میں حاصل کریں اور نوکریوں کے لیے درخواست دینا شروع کریں۔",
  },

  "landing.testimonials.title": {
    en: "Real workers, real results",
    ar: "عمّال حقيقيون، نتائج حقيقية",
    ur: "حقیقی کارکن، حقیقی نتائج",
  },
  "landing.testimonial.1": {
    en: "I never knew how to write a CV. VoiceCV made me feel confident. I got a job in 2 weeks!",
    ar: "لم أكن أعرف كيف أكتب سيرة ذاتية. منحتني VoiceCV الثقة، وحصلت على وظيفة خلال أسبوعين!",
    ur: "میں CV لکھنا نہیں جانتا تھا۔ VoiceCV نے مجھے اعتماد دیا۔ 2 ہفتوں میں نوکری مل گئی!",
  },
  "landing.testimonial.1.name": {
    en: "Ahmad — Construction Worker, Riyadh",
    ar: "أحمد — عامل بناء، الرياض",
    ur: "احمد — تعمیراتی کارکن، ریاض",
  },
  "landing.testimonial.2": {
    en: "The Arabic option was perfect. The CV looked so professional, I couldn't believe I made it myself.",
    ar: "كان الخيار العربي مثالياً. بدت السيرة احترافية جداً، لم أصدق أنني صنعتها بنفسي.",
    ur: "عربی آپشن بہترین تھا۔ CV اتنا پیشہ ورانہ لگ رہا تھا کہ یقین نہیں آیا یہ میں نے بنایا ہے۔",
  },
  "landing.testimonial.2.name": {
    en: "Fatima — Job Seeker, Jeddah",
    ar: "فاطمة — باحثة عن عمل، جدة",
    ur: "فاطمہ — ملازمت کی متلاشی، جدہ",
  },
  "landing.testimonial.3": {
    en: "Simple, fast, and it actually worked. The employer was impressed by my CV.",
    ar: "بسيط، سريع، ونجح فعلاً. أُعجب صاحب العمل بسيرتي الذاتية.",
    ur: "سادہ، تیز، اور واقعی کام کیا۔ آجر میرے CV سے متاثر ہوا۔",
  },
  "landing.testimonial.3.name": {
    en: "Ravi — Expat Worker, Dammam",
    ar: "رافي — عامل وافد، الدمام",
    ur: "روی — تارکِ وطن کارکن، دمام",
  },

  "landing.trust.powered": {
    en: "Developed by DevVibe AI",
    ar: "من تطوير DevVibe AI",
    ur: "DevVibe AI کا تیار کردہ",
  },
  "landing.trust.vision": {
    en: "Built for Saudi Vision 2030",
    ar: "مبني لرؤية السعودية 2030",
    ur: "سعودی وژن 2030 کے لیے بنایا گیا",
  },
  "landing.trust.nocode": {
    en: "No coding required",
    ar: "لا تحتاج برمجة",
    ur: "کوڈنگ کی ضرورت نہیں",
  },

  // Auth
  "auth.login.title": {
    en: "Welcome back",
    ar: "مرحباً بعودتك",
    ur: "خوش آمدید",
  },
  "auth.signup.title": {
    en: "Create your account",
    ar: "أنشئ حسابك",
    ur: "اپنا اکاؤنٹ بنائیں",
  },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني", ur: "ای میل" },
  "auth.password": { en: "Password", ar: "كلمة المرور", ur: "پاس ورڈ" },
  "auth.fullName": { en: "Full name", ar: "الاسم الكامل", ur: "پورا نام" },
  "auth.signIn": { en: "Sign in", ar: "تسجيل الدخول", ur: "سائن ان" },
  "auth.signUp": { en: "Sign up", ar: "إنشاء حساب", ur: "سائن اپ" },
  "auth.signOut": { en: "Sign out", ar: "تسجيل الخروج", ur: "سائن آؤٹ" },
  "auth.haveAccount": {
    en: "Already have an account?",
    ar: "لديك حساب بالفعل؟",
    ur: "کیا پہلے سے اکاؤنٹ ہے؟",
  },
  "auth.noAccount": {
    en: "Don't have an account?",
    ar: "ليس لديك حساب؟",
    ur: "اکاؤنٹ نہیں ہے؟",
  },

  // Dashboard
  "dashboard.welcome": { en: "Welcome", ar: "أهلاً", ur: "خوش آمدید" },
  "dashboard.create": {
    en: "Create New CV",
    ar: "أنشئ سيرة ذاتية جديدة",
    ur: "نیا CV بنائیں",
  },
  "dashboard.myCvs": { en: "My CVs", ar: "سيرتي الذاتية", ur: "میرے CVs" },
  "dashboard.empty.title": {
    en: "Create your first CV in 5 minutes",
    ar: "أنشئ أول سيرة ذاتية في ٥ دقائق",
    ur: "5 منٹ میں اپنا پہلا CV بنائیں",
  },
  "dashboard.empty.desc": {
    en: "Answer a few voice questions and let AI do the rest.",
    ar: "أجب عن بعض الأسئلة الصوتية ودع الذكاء الاصطناعي يقوم بالباقي.",
    ur: "چند آواز کے سوالات کا جواب دیں، باقی AI کرے گا۔",
  },

  // Status
  "status.processing": {
    en: "Processing",
    ar: "قيد المعالجة",
    ur: "پراسیسنگ",
  },
  "status.ready": { en: "Ready", ar: "جاهزة", ur: "تیار" },
  "status.exported": {
    en: "Exported",
    ar: "تم التصدير",
    ur: "ایکسپورٹ ہو گیا",
  },
  "status.failed": { en: "Failed", ar: "فشلت", ur: "ناکام" },

  // Recorder
  "rec.questionOf": {
    en: "Question {n} of {total}",
    ar: "السؤال {n} من {total}",
    ur: "سوال {n} از {total}",
  },
  "rec.start": {
    en: "Start Recording",
    ar: "ابدأ التسجيل",
    ur: "ریکارڈنگ شروع کریں",
  },
  "rec.stop": { en: "Stop", ar: "إيقاف", ur: "روکیں" },
  "rec.rerecord": {
    en: "Re-record",
    ar: "إعادة التسجيل",
    ur: "دوبارہ ریکارڈ کریں",
  },
  "rec.next": { en: "Next Question", ar: "السؤال التالي", ur: "اگلا سوال" },
  "rec.skip": {
    en: "Skip this question",
    ar: "تخطي هذا السؤال",
    ur: "یہ سوال چھوڑیں",
  },
  "rec.submit": {
    en: "Submit All Answers",
    ar: "إرسال جميع الإجابات",
    ur: "تمام جوابات جمع کرائیں",
  },
  "rec.micDenied": {
    en: "Microphone permission denied. Please allow access in your browser settings.",
    ar: "تم رفض الإذن للميكروفون. الرجاء السماح بالوصول من إعدادات المتصفح.",
    ur: "مائیکروفون کی اجازت مسترد کر دی گئی۔ براہ کرم اپنے براؤزر کی ترتیبات سے اجازت دیں۔",
  },
  "rec.unsupported": {
    en: "Audio recording not supported. Please use Chrome or Firefox.",
    ar: "تسجيل الصوت غير مدعوم. الرجاء استخدام Chrome أو Firefox.",
    ur: "آڈیو ریکارڈنگ سپورٹ نہیں ہے۔ براہ کرم Chrome یا Firefox استعمال کریں۔",
  },
  "rec.processing.transcribing": {
    en: "Transcribing audio…",
    ar: "جارٍ تحويل الصوت إلى نص…",
    ur: "آڈیو کو متن میں تبدیل کیا جا رہا ہے…",
  },
  "rec.processing.understanding": {
    en: "Reading your experience…",
    ar: "نقرأ خبرتك…",
    ur: "آپ کا تجربہ پڑھ رہے ہیں…",
  },
  "rec.processing.writing": {
    en: "Writing your CV…",
    ar: "نكتب سيرتك الذاتية…",
    ur: "آپ کا CV لکھ رہے ہیں…",
  },
  "rec.processing.done": {
    en: "Your CV is ready!",
    ar: "سيرتك الذاتية جاهزة!",
    ur: "آپ کا CV تیار ہے!",
  },
  "rec.viewCv": { en: "View My CV", ar: "عرض سيرتي", ur: "میرا CV دیکھیں" },

  // CV sections
  "cv.objective": { en: "Objective", ar: "الهدف المهني", ur: "مقصد" },
  "cv.experience": {
    en: "Work Experience",
    ar: "الخبرة العملية",
    ur: "کام کا تجربہ",
  },
  "cv.education": { en: "Education", ar: "التعليم", ur: "تعلیم" },
  "cv.certificates": {
    en: "Certificates & Training",
    ar: "الشهادات والتدريب",
    ur: "سرٹیفکیٹ اور تربیت",
  },
  "cv.skills": { en: "Skills", ar: "المهارات", ur: "مہارتیں" },
  "cv.languages": { en: "Languages", ar: "اللغات", ur: "زبانیں" },
  "cv.hobbies": { en: "Hobbies", ar: "الهوايات", ur: "مشاغل" },
  "cv.achievement": {
    en: "Key Achievement",
    ar: "إنجاز رئيسي",
    ur: "اہم کامیابی",
  },
  "cv.contact": { en: "Contact", ar: "التواصل", ur: "رابطہ" },
  "cv.nationality": { en: "Nationality", ar: "الجنسية", ur: "قومیت" },
  "cv.download": {
    en: "Download PDF",
    ar: "تحميل PDF",
    ur: "PDF ڈاؤن لوڈ کریں",
  },
  "cv.edit": { en: "Edit", ar: "تعديل", ur: "ترمیم" },
  "cv.done": { en: "Done", ar: "تم", ur: "ہو گیا" },
  "cv.regenerate": {
    en: "Regenerate with AI",
    ar: "إعادة الإنشاء بالذكاء الاصطناعي",
    ur: "AI سے دوبارہ بنائیں",
  },

  // Onboarding
  "onb.title": {
    en: "What language would you like to use?",
    ar: "ما اللغة التي ترغب باستخدامها؟",
    ur: "آپ کون سی زبان استعمال کرنا چاہیں گے؟",
  },
  "onb.continue": { en: "Continue", ar: "متابعة", ur: "جاری رکھیں" },

  // Common
  "common.back": { en: "Back", ar: "رجوع", ur: "واپس" },
  "common.cancel": { en: "Cancel", ar: "إلغاء", ur: "منسوخ" },
  "common.save": { en: "Save", ar: "حفظ", ur: "محفوظ کریں" },
  "common.retry": {
    en: "Retry",
    ar: "إعادة المحاولة",
    ur: "دوبارہ کوشش کریں",
  },
  "common.loading": {
    en: "Loading…",
    ar: "جارٍ التحميل…",
    ur: "لوڈ ہو رہا ہے…",
  },

  // Editor — add / remove
  "edit.add.skill": { en: "Add skill", ar: "إضافة مهارة", ur: "مہارت شامل کریں" },
  "edit.add.language": {
    en: "Add language",
    ar: "إضافة لغة",
    ur: "زبان شامل کریں",
  },
  "edit.add.hobby": {
    en: "Add hobby",
    ar: "إضافة هواية",
    ur: "مشغلہ شامل کریں",
  },
  "edit.add.experience": {
    en: "Add experience",
    ar: "إضافة خبرة",
    ur: "تجربہ شامل کریں",
  },
  "edit.add.education": {
    en: "Add education",
    ar: "إضافة تعليم",
    ur: "تعلیم شامل کریں",
  },
  "edit.add.certificate": {
    en: "Add certificate",
    ar: "إضافة شهادة",
    ur: "سرٹیفکیٹ شامل کریں",
  },
  "edit.add.achievement": {
    en: "Add achievement",
    ar: "إضافة إنجاز",
    ur: "کامیابی شامل کریں",
  },
  "edit.remove": { en: "Remove", ar: "حذف", ur: "حذف کریں" },

  "edit.proficiency.beginner": {
    en: "Beginner",
    ar: "مبتدئ",
    ur: "ابتدائی",
  },
  "edit.proficiency.conversational": {
    en: "Conversational",
    ar: "متوسط",
    ur: "گفتگو کی سطح",
  },
  "edit.proficiency.fluent": {
    en: "Fluent",
    ar: "متقدم",
    ur: "روانی",
  },
  "edit.placeholder.skill": { en: "e.g. forklift driving", ar: "مثال: قيادة الرافعة", ur: "مثال: فورک لفٹ چلانا" },
  "edit.placeholder.hobby": { en: "e.g. reading", ar: "مثال: القراءة", ur: "مثال: مطالعہ" },
  "edit.placeholder.langName": { en: "Language", ar: "اللغة", ur: "زبان" },
  "edit.hint.bullets": {
    en: "Tip: put each bullet on its own line.",
    ar: "نصيحة: ضع كل نقطة في سطر منفصل.",
    ur: "تجویز: ہر نکتہ الگ سطر میں لکھیں۔",
  },
  "edit.banner": {
    en: "Edit mode — click any field to change it, or use the + buttons to add more.",
    ar: "وضع التعديل — انقر على أي حقل لتغييره، أو استخدم زر + لإضافة المزيد.",
    ur: "ایڈٹ موڈ — کسی بھی فیلڈ پر کلک کر کے تبدیل کریں، یا + بٹن سے مزید شامل کریں۔",
  },
};

export function tr(
  key: string,
  lang: Language,
  vars?: Record<string, string | number>,
): string {
  const entry = t[key];
  if (!entry) return key;
  let text = entry[lang] || entry.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
