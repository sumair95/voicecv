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
  { code: "hi", label: "हिन्दी", english: "Hindi", dir: "ltr" },
];

export function dirFor(lang: Language): "ltr" | "rtl" {
  return lang === "ar" || lang === "ur" ? "rtl" : "ltr";
}

type Entry = { en: string; ar: string; ur: string; hi: string };
type Dict = Record<string, Entry>;

export const t: Dict = {
  // Landing
  "landing.tagline": {
    en: "Speak. We Write. You Succeed.",
    ar: "تحدّث. نحن نكتب. أنت تنجح.",
    ur: "بولیں۔ ہم لکھیں گے۔ آپ کامیاب ہوں گے۔",
    hi: "बोलिए। हम लिखेंगे। आप सफल होंगे।",
  },
  "landing.subhead": {
    en: "Turn a 5-minute voice recording into a professional CV — free, in Arabic, English, Urdu or Hindi.",
    ar: "حوّل تسجيلاً صوتياً مدته ٥ دقائق إلى سيرة ذاتية احترافية — مجاناً، بالعربية أو الإنجليزية أو الأردية أو الهندية.",
    ur: "5 منٹ کی آواز کی ریکارڈنگ کو پیشہ ورانہ CV میں تبدیل کریں — مفت، انگریزی، عربی، اردو یا ہندی میں۔",
    hi: "5 मिनट की वॉयस रिकॉर्डिंग को पेशेवर CV में बदलें — मुफ़्त, अंग्रेज़ी, अरबी, उर्दू या हिन्दी में।",
  },
  "landing.cta.primary": {
    en: "Create My CV Free",
    ar: "أنشئ سيرتي مجاناً",
    ur: "میرا CV مفت بنائیں",
    hi: "मेरा CV मुफ़्त बनाएं",
  },
  "landing.cta.secondary": {
    en: "See Demo",
    ar: "شاهد العرض",
    ur: "ڈیمو دیکھیں",
    hi: "डेमो देखें",
  },
  "landing.stats.cvs": {
    en: "CVs Generated",
    ar: "سيرة ذاتية تم إنشاؤها",
    ur: "CVs بنائے گئے",
    hi: "CV बनाए गए",
  },
  "landing.stats.minutes": {
    en: "Minutes to Complete",
    ar: "دقائق للإنجاز",
    ur: "مکمل کرنے کے منٹ",
    hi: "पूरा करने में मिनट",
  },
  "landing.stats.languages": {
    en: "Languages Supported",
    ar: "لغات مدعومة",
    ur: "زبانیں دستیاب",
    hi: "भाषाएं समर्थित",
  },
  "landing.stats.free": { en: "Free", ar: "مجاني", ur: "مفت", hi: "मुफ़्त" },

  "landing.steps.title": {
    en: "How it works",
    ar: "كيف يعمل",
    ur: "یہ کیسے کام کرتا ہے",
    hi: "यह कैसे काम करता है",
  },
  "landing.step1.title": {
    en: "Answer Simple Voice Questions",
    ar: "أجب على أسئلة صوتية بسيطة",
    ur: "آسان آواز کے سوالات کا جواب دیں",
    hi: "आसान वॉयस सवालों के जवाब दें",
  },
  "landing.step1.desc": {
    en: "Speak naturally in your own language. No typing.",
    ar: "تحدث بلغتك بطريقة طبيعية. لا حاجة للكتابة.",
    ur: "اپنی زبان میں قدرتی طور پر بولیں۔ کوئی ٹائپنگ نہیں۔",
    hi: "अपनी भाषा में स्वाभाविक रूप से बोलें। कोई टाइपिंग नहीं।",
  },
  "landing.step2.title": {
    en: "AI Writes Your CV",
    ar: "الذكاء الاصطناعي يكتب سيرتك",
    ur: "AI آپ کا CV لکھتا ہے",
    hi: "AI आपका CV लिखता है",
  },
  "landing.step2.desc": {
    en: "We turn your answers into a polished, professional CV.",
    ar: "نحول إجاباتك إلى سيرة ذاتية احترافية ومنسقة.",
    ur: "ہم آپ کے جوابات کو ایک پیشہ ورانہ CV میں تبدیل کرتے ہیں۔",
    hi: "हम आपके जवाबों को एक पेशेवर CV में बदलते हैं।",
  },
  "landing.step3.title": {
    en: "Download & Apply",
    ar: "حمّل وتقدّم",
    ur: "ڈاؤن لوڈ کریں اور درخواست دیں",
    hi: "डाउनलोड करें और आवेदन करें",
  },
  "landing.step3.desc": {
    en: "Get your CV as a PDF and start applying for jobs.",
    ar: "احصل على سيرتك بصيغة PDF وابدأ بالتقديم على الوظائف.",
    ur: "اپنا CV PDF میں حاصل کریں اور نوکریوں کے لیے درخواست دینا شروع کریں۔",
    hi: "अपना CV PDF में पाएं और नौकरियों के लिए आवेदन शुरू करें।",
  },

  "landing.testimonials.title": {
    en: "Real workers, real results",
    ar: "عمّال حقيقيون، نتائج حقيقية",
    ur: "حقیقی کارکن، حقیقی نتائج",
    hi: "असली कामगार, असली नतीजे",
  },
  "landing.testimonial.1": {
    en: "I never knew how to write a CV. VoiceCV made me feel confident. I got a job in 2 weeks!",
    ar: "لم أكن أعرف كيف أكتب سيرة ذاتية. منحتني VoiceCV الثقة، وحصلت على وظيفة خلال أسبوعين!",
    ur: "میں CV لکھنا نہیں جانتا تھا۔ VoiceCV نے مجھے اعتماد دیا۔ 2 ہفتوں میں نوکری مل گئی!",
    hi: "मुझे CV लिखना नहीं आता था। VoiceCV ने आत्मविश्वास दिया। 2 हफ़्तों में नौकरी मिल गई!",
  },
  "landing.testimonial.1.name": {
    en: "Ahmad — Construction Worker, Riyadh",
    ar: "أحمد — عامل بناء، الرياض",
    ur: "احمد — تعمیراتی کارکن، ریاض",
    hi: "अहमद — निर्माण कर्मचारी, रियाद",
  },
  "landing.testimonial.2": {
    en: "The Arabic option was perfect. The CV looked so professional, I couldn't believe I made it myself.",
    ar: "كان الخيار العربي مثالياً. بدت السيرة احترافية جداً، لم أصدق أنني صنعتها بنفسي.",
    ur: "عربی آپشن بہترین تھا۔ CV اتنا پیشہ ورانہ لگ رہا تھا کہ یقین نہیں آیا یہ میں نے بنایا ہے۔",
    hi: "अरबी विकल्प परफ़ेक्ट था। CV इतना पेशेवर लगा कि यक़ीन नहीं हुआ मैंने ख़ुद बनाया।",
  },
  "landing.testimonial.2.name": {
    en: "Fatima — Job Seeker, Jeddah",
    ar: "فاطمة — باحثة عن عمل، جدة",
    ur: "فاطمہ — ملازمت کی متلاشی، جدہ",
    hi: "फ़ातिमा — नौकरी की तलाश में, जेद्दा",
  },
  "landing.testimonial.3": {
    en: "Simple, fast, and it actually worked. The employer was impressed by my CV.",
    ar: "بسيط، سريع، ونجح فعلاً. أُعجب صاحب العمل بسيرتي الذاتية.",
    ur: "سادہ، تیز، اور واقعی کام کیا۔ آجر میرے CV سے متاثر ہوا۔",
    hi: "सरल, तेज़, और सच में काम किया। नियोक्ता मेरे CV से प्रभावित हुए।",
  },
  "landing.testimonial.3.name": {
    en: "Ravi — Expat Worker, Dammam",
    ar: "رافي — عامل وافد، الدمام",
    ur: "روی — تارکِ وطن کارکن، دمام",
    hi: "रवि — प्रवासी कर्मचारी, दम्माम",
  },

  "landing.trust.powered": {
    en: "Developed by DevVibe AI",
    ar: "من تطوير DevVibe AI",
    ur: "DevVibe AI کا تیار کردہ",
    hi: "DevVibe AI द्वारा विकसित",
  },
  "landing.trust.vision": {
    en: "Built for Saudi Vision 2030",
    ar: "مبني لرؤية السعودية 2030",
    ur: "سعودی وژن 2030 کے لیے بنایا گیا",
    hi: "सऊदी विज़न 2030 के लिए बनाया गया",
  },
  "landing.trust.nocode": {
    en: "No coding required",
    ar: "لا تحتاج برمجة",
    ur: "کوڈنگ کی ضرورت نہیں",
    hi: "कोडिंग की ज़रूरत नहीं",
  },

  // Auth
  "auth.login.title": {
    en: "Welcome back",
    ar: "مرحباً بعودتك",
    ur: "خوش آمدید",
    hi: "वापसी पर स्वागत है",
  },
  "auth.signup.title": {
    en: "Create your account",
    ar: "أنشئ حسابك",
    ur: "اپنا اکاؤنٹ بنائیں",
    hi: "अपना खाता बनाएं",
  },
  "auth.email": {
    en: "Email",
    ar: "البريد الإلكتروني",
    ur: "ای میل",
    hi: "ईमेल",
  },
  "auth.password": {
    en: "Password",
    ar: "كلمة المرور",
    ur: "پاس ورڈ",
    hi: "पासवर्ड",
  },
  "auth.fullName": {
    en: "Full name",
    ar: "الاسم الكامل",
    ur: "پورا نام",
    hi: "पूरा नाम",
  },
  "auth.signIn": {
    en: "Sign in",
    ar: "تسجيل الدخول",
    ur: "سائن ان",
    hi: "साइन इन",
  },
  "auth.signUp": {
    en: "Sign up",
    ar: "إنشاء حساب",
    ur: "سائن اپ",
    hi: "साइन अप",
  },
  "auth.signOut": {
    en: "Sign out",
    ar: "تسجيل الخروج",
    ur: "سائن آؤٹ",
    hi: "साइन आउट",
  },
  "auth.haveAccount": {
    en: "Already have an account?",
    ar: "لديك حساب بالفعل؟",
    ur: "کیا پہلے سے اکاؤنٹ ہے؟",
    hi: "पहले से खाता है?",
  },
  "auth.noAccount": {
    en: "Don't have an account?",
    ar: "ليس لديك حساب؟",
    ur: "اکاؤنٹ نہیں ہے؟",
    hi: "खाता नहीं है?",
  },

  // Dashboard
  "dashboard.welcome": { en: "Welcome", ar: "أهلاً", ur: "خوش آمدید", hi: "स्वागत है" },
  "dashboard.create": {
    en: "Create New CV",
    ar: "أنشئ سيرة ذاتية جديدة",
    ur: "نیا CV بنائیں",
    hi: "नया CV बनाएं",
  },
  "dashboard.myCvs": {
    en: "My CVs",
    ar: "سيرتي الذاتية",
    ur: "میرے CVs",
    hi: "मेरे CVs",
  },
  "dashboard.empty.title": {
    en: "Create your first CV in 5 minutes",
    ar: "أنشئ أول سيرة ذاتية في ٥ دقائق",
    ur: "5 منٹ میں اپنا پہلا CV بنائیں",
    hi: "5 मिनट में अपना पहला CV बनाएं",
  },
  "dashboard.empty.desc": {
    en: "Answer a few voice questions and let AI do the rest.",
    ar: "أجب عن بعض الأسئلة الصوتية ودع الذكاء الاصطناعي يقوم بالباقي.",
    ur: "چند آواز کے سوالات کا جواب دیں، باقی AI کرے گا۔",
    hi: "कुछ वॉयस सवालों के जवाब दें, बाक़ी AI करेगा।",
  },

  // Status
  "status.processing": {
    en: "Processing",
    ar: "قيد المعالجة",
    ur: "پراسیسنگ",
    hi: "प्रक्रिया में",
  },
  "status.ready": { en: "Ready", ar: "جاهزة", ur: "تیار", hi: "तैयार" },
  "status.exported": {
    en: "Exported",
    ar: "تم التصدير",
    ur: "ایکسپورٹ ہو گیا",
    hi: "एक्सपोर्ट किया",
  },
  "status.failed": { en: "Failed", ar: "فشلت", ur: "ناکام", hi: "विफल" },

  // Recorder
  "rec.questionOf": {
    en: "Question {n} of {total}",
    ar: "السؤال {n} من {total}",
    ur: "سوال {n} از {total}",
    hi: "सवाल {n} / {total}",
  },
  "rec.start": {
    en: "Start Recording",
    ar: "ابدأ التسجيل",
    ur: "ریکارڈنگ شروع کریں",
    hi: "रिकॉर्डिंग शुरू करें",
  },
  "rec.stop": { en: "Stop", ar: "إيقاف", ur: "روکیں", hi: "रोकें" },
  "rec.rerecord": {
    en: "Re-record",
    ar: "إعادة التسجيل",
    ur: "دوبارہ ریکارڈ کریں",
    hi: "फिर रिकॉर्ड करें",
  },
  "rec.next": {
    en: "Next Question",
    ar: "السؤال التالي",
    ur: "اگلا سوال",
    hi: "अगला सवाल",
  },
  "rec.skip": {
    en: "Skip this question",
    ar: "تخطي هذا السؤال",
    ur: "یہ سوال چھوڑیں",
    hi: "यह सवाल छोड़ें",
  },
  "rec.submit": {
    en: "Submit All Answers",
    ar: "إرسال جميع الإجابات",
    ur: "تمام جوابات جمع کرائیں",
    hi: "सभी जवाब जमा करें",
  },
  "rec.micDenied": {
    en: "Microphone permission denied. Please allow access in your browser settings.",
    ar: "تم رفض الإذن للميكروفون. الرجاء السماح بالوصول من إعدادات المتصفح.",
    ur: "مائیکروفون کی اجازت مسترد کر دی گئی۔ براہ کرم اپنے براؤزر کی ترتیبات سے اجازت دیں۔",
    hi: "माइक्रोफ़ोन की अनुमति अस्वीकृत है। कृपया ब्राउज़र सेटिंग्स से अनुमति दें।",
  },
  "rec.unsupported": {
    en: "Audio recording not supported. Please use Chrome or Firefox.",
    ar: "تسجيل الصوت غير مدعوم. الرجاء استخدام Chrome أو Firefox.",
    ur: "آڈیو ریکارڈنگ سپورٹ نہیں ہے۔ براہ کرم Chrome یا Firefox استعمال کریں۔",
    hi: "ऑडियो रिकॉर्डिंग समर्थित नहीं है। कृपया Chrome या Firefox का उपयोग करें।",
  },
  "rec.processing.transcribing": {
    en: "Transcribing audio…",
    ar: "جارٍ تحويل الصوت إلى نص…",
    ur: "آڈیو کو متن میں تبدیل کیا جا رہا ہے…",
    hi: "ऑडियो को टेक्स्ट में बदला जा रहा है…",
  },
  "rec.processing.understanding": {
    en: "Reading your experience…",
    ar: "نقرأ خبرتك…",
    ur: "آپ کا تجربہ پڑھ رہے ہیں…",
    hi: "आपका अनुभव पढ़ रहे हैं…",
  },
  "rec.processing.writing": {
    en: "Writing your CV…",
    ar: "نكتب سيرتك الذاتية…",
    ur: "آپ کا CV لکھ رہے ہیں…",
    hi: "आपका CV लिख रहे हैं…",
  },
  "rec.processing.done": {
    en: "Your CV is ready!",
    ar: "سيرتك الذاتية جاهزة!",
    ur: "آپ کا CV تیار ہے!",
    hi: "आपका CV तैयार है!",
  },
  "rec.viewCv": {
    en: "View My CV",
    ar: "عرض سيرتي",
    ur: "میرا CV دیکھیں",
    hi: "मेरा CV देखें",
  },

  // CV sections
  "cv.objective": {
    en: "Objective",
    ar: "الهدف المهني",
    ur: "مقصد",
    hi: "उद्देश्य",
  },
  "cv.experience": {
    en: "Work Experience",
    ar: "الخبرة العملية",
    ur: "کام کا تجربہ",
    hi: "कार्य अनुभव",
  },
  "cv.education": {
    en: "Education",
    ar: "التعليم",
    ur: "تعلیم",
    hi: "शिक्षा",
  },
  "cv.certificates": {
    en: "Certificates & Training",
    ar: "الشهادات والتدريب",
    ur: "سرٹیفکیٹ اور تربیت",
    hi: "सर्टिफिकेट और प्रशिक्षण",
  },
  "cv.skills": { en: "Skills", ar: "المهارات", ur: "مہارتیں", hi: "कौशल" },
  "cv.languages": { en: "Languages", ar: "اللغات", ur: "زبانیں", hi: "भाषाएं" },
  "cv.hobbies": { en: "Hobbies", ar: "الهوايات", ur: "مشاغل", hi: "शौक़" },
  "cv.achievement": {
    en: "Key Achievement",
    ar: "إنجاز رئيسي",
    ur: "اہم کامیابی",
    hi: "मुख्य उपलब्धि",
  },
  "cv.contact": {
    en: "Contact",
    ar: "التواصل",
    ur: "رابطہ",
    hi: "संपर्क",
  },
  "cv.nationality": {
    en: "Nationality",
    ar: "الجنسية",
    ur: "قومیت",
    hi: "राष्ट्रीयता",
  },
  "cv.download": {
    en: "Download PDF",
    ar: "تحميل PDF",
    ur: "PDF ڈاؤن لوڈ کریں",
    hi: "PDF डाउनलोड करें",
  },
  "cv.edit": { en: "Edit", ar: "تعديل", ur: "ترمیم", hi: "संपादित करें" },
  "cv.done": { en: "Done", ar: "تم", ur: "ہو گیا", hi: "हो गया" },
  "cv.regenerate": {
    en: "Regenerate with AI",
    ar: "إعادة الإنشاء بالذكاء الاصطناعي",
    ur: "AI سے دوبارہ بنائیں",
    hi: "AI से फिर बनाएं",
  },

  // Onboarding
  "onb.title": {
    en: "What language would you like to use?",
    ar: "ما اللغة التي ترغب باستخدامها؟",
    ur: "آپ کون سی زبان استعمال کرنا چاہیں گے؟",
    hi: "आप कौन सी भाषा का उपयोग करना चाहेंगे?",
  },
  "onb.continue": {
    en: "Continue",
    ar: "متابعة",
    ur: "جاری رکھیں",
    hi: "जारी रखें",
  },

  // Common
  "common.back": { en: "Back", ar: "رجوع", ur: "واپس", hi: "वापस" },
  "common.cancel": { en: "Cancel", ar: "إلغاء", ur: "منسوخ", hi: "रद्द करें" },
  "common.save": { en: "Save", ar: "حفظ", ur: "محفوظ کریں", hi: "सहेजें" },
  "common.retry": {
    en: "Retry",
    ar: "إعادة المحاولة",
    ur: "دوبارہ کوشش کریں",
    hi: "पुनः प्रयास करें",
  },
  "common.loading": {
    en: "Loading…",
    ar: "جارٍ التحميل…",
    ur: "لوڈ ہو رہا ہے…",
    hi: "लोड हो रहा है…",
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
