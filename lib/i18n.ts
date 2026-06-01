import type { Language } from "@/types/cv";

export const LANGUAGES: { code: Language; label: string; dir: "ltr" | "rtl" }[] =
  [
    { code: "en", label: "English", dir: "ltr" },
    { code: "ar", label: "العربية", dir: "rtl" },
  ];

export function dirFor(lang: Language): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

type Dict = Record<string, { en: string; ar: string }>;

export const t: Dict = {
  // Landing
  "landing.tagline": {
    en: "Speak. We Write. You Succeed.",
    ar: "تحدّث. نحن نكتب. أنت تنجح.",
  },
  "landing.subhead": {
    en: "Turn a 5-minute voice recording into a professional CV — free, in Arabic or English.",
    ar: "حوّل تسجيلاً صوتياً مدته ٥ دقائق إلى سيرة ذاتية احترافية — مجاناً، بالعربية أو الإنجليزية.",
  },
  "landing.cta.primary": { en: "Create My CV Free", ar: "أنشئ سيرتي مجاناً" },
  "landing.cta.secondary": { en: "See Demo", ar: "شاهد العرض" },
  "landing.stats.cvs": { en: "CVs Generated", ar: "سيرة ذاتية تم إنشاؤها" },
  "landing.stats.minutes": { en: "Minutes to Complete", ar: "دقائق للإنجاز" },
  "landing.stats.languages": { en: "Languages Supported", ar: "لغات مدعومة" },
  "landing.stats.free": { en: "Free", ar: "مجاني" },

  "landing.steps.title": { en: "How it works", ar: "كيف يعمل" },
  "landing.step1.title": {
    en: "Answer 5 Simple Questions",
    ar: "أجب على ٥ أسئلة بسيطة",
  },
  "landing.step1.desc": {
    en: "Speak naturally in your own language. No typing.",
    ar: "تحدث بلغتك بطريقة طبيعية. لا حاجة للكتابة.",
  },
  "landing.step2.title": { en: "AI Writes Your CV", ar: "الذكاء الاصطناعي يكتب سيرتك" },
  "landing.step2.desc": {
    en: "We turn your answers into a polished, professional CV.",
    ar: "نحول إجاباتك إلى سيرة ذاتية احترافية ومنسقة.",
  },
  "landing.step3.title": { en: "Download & Apply", ar: "حمّل وتقدّم" },
  "landing.step3.desc": {
    en: "Get your CV as a PDF and start applying for jobs.",
    ar: "احصل على سيرتك بصيغة PDF وابدأ بالتقديم على الوظائف.",
  },

  "landing.testimonials.title": {
    en: "Real workers, real results",
    ar: "عمّال حقيقيون، نتائج حقيقية",
  },
  "landing.testimonial.1": {
    en: "I never knew how to write a CV. VoiceCV made me feel confident. I got a job in 2 weeks!",
    ar: "لم أكن أعرف كيف أكتب سيرة ذاتية. منحتني VoiceCV الثقة، وحصلت على وظيفة خلال أسبوعين!",
  },
  "landing.testimonial.1.name": {
    en: "Ahmad — Construction Worker, Riyadh",
    ar: "أحمد — عامل بناء، الرياض",
  },
  "landing.testimonial.2": {
    en: "The Arabic option was perfect. The CV looked so professional, I couldn't believe I made it myself.",
    ar: "كان الخيار العربي مثالياً. بدت السيرة احترافية جداً، لم أصدق أنني صنعتها بنفسي.",
  },
  "landing.testimonial.2.name": {
    en: "Fatima — Job Seeker, Jeddah",
    ar: "فاطمة — باحثة عن عمل، جدة",
  },
  "landing.testimonial.3": {
    en: "Simple, fast, and it actually worked. The employer was impressed by my CV.",
    ar: "بسيط، سريع، ونجح فعلاً. أُعجب صاحب العمل بسيرتي الذاتية.",
  },
  "landing.testimonial.3.name": {
    en: "Ravi — Expat Worker, Dammam",
    ar: "رافي — عامل وافد، الدمام",
  },

  "landing.trust.powered": { en: "Powered by Claude AI", ar: "مدعوم بـ Claude AI" },
  "landing.trust.vision": {
    en: "Built for Saudi Vision 2030",
    ar: "مبني لرؤية السعودية 2030",
  },
  "landing.trust.nocode": { en: "No coding required", ar: "لا تحتاج برمجة" },

  // Auth
  "auth.login.title": { en: "Welcome back", ar: "مرحباً بعودتك" },
  "auth.signup.title": { en: "Create your account", ar: "أنشئ حسابك" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني" },
  "auth.password": { en: "Password", ar: "كلمة المرور" },
  "auth.fullName": { en: "Full name", ar: "الاسم الكامل" },
  "auth.signIn": { en: "Sign in", ar: "تسجيل الدخول" },
  "auth.signUp": { en: "Sign up", ar: "إنشاء حساب" },
  "auth.signOut": { en: "Sign out", ar: "تسجيل الخروج" },
  "auth.haveAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  "auth.noAccount": { en: "Don't have an account?", ar: "ليس لديك حساب؟" },

  // Dashboard
  "dashboard.welcome": { en: "Welcome", ar: "أهلاً" },
  "dashboard.create": { en: "Create New CV", ar: "أنشئ سيرة ذاتية جديدة" },
  "dashboard.myCvs": { en: "My CVs", ar: "سيرتي الذاتية" },
  "dashboard.empty.title": {
    en: "Create your first CV in 5 minutes",
    ar: "أنشئ أول سيرة ذاتية في ٥ دقائق",
  },
  "dashboard.empty.desc": {
    en: "Answer a few voice questions and let AI do the rest.",
    ar: "أجب عن بعض الأسئلة الصوتية ودع الذكاء الاصطناعي يقوم بالباقي.",
  },

  // Status
  "status.processing": { en: "Processing", ar: "قيد المعالجة" },
  "status.ready": { en: "Ready", ar: "جاهزة" },
  "status.exported": { en: "Exported", ar: "تم التصدير" },
  "status.failed": { en: "Failed", ar: "فشلت" },

  // Recorder
  "rec.questionOf": { en: "Question {n} of {total}", ar: "السؤال {n} من {total}" },
  "rec.start": { en: "Start Recording", ar: "ابدأ التسجيل" },
  "rec.stop": { en: "Stop", ar: "إيقاف" },
  "rec.rerecord": { en: "Re-record", ar: "إعادة التسجيل" },
  "rec.next": { en: "Next Question", ar: "السؤال التالي" },
  "rec.submit": { en: "Submit All Answers", ar: "إرسال جميع الإجابات" },
  "rec.micDenied": {
    en: "Microphone permission denied. Please allow access in your browser settings.",
    ar: "تم رفض الإذن للميكروفون. الرجاء السماح بالوصول من إعدادات المتصفح.",
  },
  "rec.unsupported": {
    en: "Audio recording not supported. Please use Chrome or Firefox.",
    ar: "تسجيل الصوت غير مدعوم. الرجاء استخدام Chrome أو Firefox.",
  },
  "rec.processing.transcribing": { en: "Transcribing audio…", ar: "جارٍ تحويل الصوت إلى نص…" },
  "rec.processing.understanding": { en: "Reading your experience…", ar: "نقرأ خبرتك…" },
  "rec.processing.writing": { en: "Writing your CV…", ar: "نكتب سيرتك الذاتية…" },
  "rec.processing.done": { en: "Your CV is ready!", ar: "سيرتك الذاتية جاهزة!" },
  "rec.viewCv": { en: "View My CV", ar: "عرض سيرتي" },

  // CV
  "cv.objective": { en: "Objective", ar: "الهدف المهني" },
  "cv.experience": { en: "Work Experience", ar: "الخبرة العملية" },
  "cv.education": { en: "Education", ar: "التعليم" },
  "cv.skills": { en: "Skills", ar: "المهارات" },
  "cv.languages": { en: "Languages", ar: "اللغات" },
  "cv.contact": { en: "Contact", ar: "التواصل" },
  "cv.download": { en: "Download PDF", ar: "تحميل PDF" },
  "cv.edit": { en: "Edit", ar: "تعديل" },
  "cv.done": { en: "Done", ar: "تم" },
  "cv.regenerate": { en: "Regenerate with AI", ar: "إعادة الإنشاء بالذكاء الاصطناعي" },

  // Onboarding
  "onb.title": { en: "What language would you like to use?", ar: "ما اللغة التي ترغب باستخدامها؟" },
  "onb.continue": { en: "Continue", ar: "متابعة" },

  // Common
  "common.back": { en: "Back", ar: "رجوع" },
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.save": { en: "Save", ar: "حفظ" },
  "common.retry": { en: "Retry", ar: "إعادة المحاولة" },
  "common.loading": { en: "Loading…", ar: "جارٍ التحميل…" },
};

export function tr(key: string, lang: Language, vars?: Record<string, string | number>): string {
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
