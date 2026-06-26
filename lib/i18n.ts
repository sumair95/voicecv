import type { Language } from "@/types/cv";

export const LANGUAGES: {
  code: Language;
  label: string;
  english: string;
  dir: "ltr" | "rtl";
}[] = [
  { code: "en", label: "English", english: "English", dir: "ltr" },
  { code: "it", label: "Italiano", english: "Italian", dir: "ltr" },
  { code: "ar", label: "العربية", english: "Arabic", dir: "rtl" },
  { code: "ur", label: "اردو", english: "Urdu", dir: "rtl" },
];

export function dirFor(lang: Language): "ltr" | "rtl" {
  return lang === "ar" || lang === "ur" ? "rtl" : "ltr";
}

type Entry = { en: string; ar: string; ur: string; it: string };
type Dict = Record<string, Entry>;

export const t: Dict = {
  // Landing
  "landing.tagline": {
    en: "Speak. We Write. You Succeed.",
    ar: "تحدّث. نحن نكتب. أنت تنجح.",
    ur: "بولیں۔ ہم لکھیں گے۔ آپ کامیاب ہوں گے۔",
    it: "Parla. Scriviamo noi. Tu hai successo.",
  },
  "landing.subhead": {
    en: "Turn a 5-minute voice recording into a professional CV — free, in Italian, English, Arabic, or Urdu.",
    ar: "حوّل تسجيلاً صوتياً مدته ٥ دقائق إلى سيرة ذاتية احترافية — مجاناً، بالإيطالية أو الإنجليزية أو العربية أو الأردية.",
    ur: "5 منٹ کی آواز کی ریکارڈنگ کو پیشہ ورانہ CV میں تبدیل کریں — مفت، اطالوی، انگریزی، عربی یا اردو میں۔",
    it: "Trasforma una registrazione vocale di 5 minuti in un CV professionale — gratis, in italiano, inglese, arabo o urdu.",
  },
  "landing.cta.primary": {
    en: "Create My CV Free",
    ar: "أنشئ سيرتي مجاناً",
    ur: "میرا CV مفت بنائیں",
    it: "Crea il mio CV gratis",
  },
  "landing.cta.secondary": {
    en: "See Demo",
    ar: "شاهد العرض",
    ur: "ڈیمو دیکھیں",
    it: "Guarda la demo",
  },
  "landing.stats.cvs": {
    en: "CVs Generated",
    ar: "سيرة ذاتية تم إنشاؤها",
    ur: "CVs بنائے گئے",
    it: "CV generati",
  },
  "landing.stats.minutes": {
    en: "Minutes to Complete",
    ar: "دقائق للإنجاز",
    ur: "مکمل کرنے کے منٹ",
    it: "Minuti per completare",
  },
  "landing.stats.languages": {
    en: "Languages Supported",
    ar: "لغات مدعومة",
    ur: "زبانیں دستیاب",
    it: "Lingue supportate",
  },
  "landing.stats.free": { en: "Free", ar: "مجاني", ur: "مفت", it: "Gratis" },
  "landing.stats.notyping": {
    en: "Typing Required",
    ar: "كتابة مطلوبة",
    ur: "ٹائپنگ درکار",
    it: "Digitazione richiesta",
  },
  "landing.testimonials.sample": {
    en: "Sample stories",
    ar: "قصص نموذجية",
    ur: "نمونہ کہانیاں",
    it: "Storie di esempio",
  },
  "landing.footer.copyright": {
    en: "© 2026 vocv — All rights reserved",
    ar: "© 2026 vocv — جميع الحقوق محفوظة",
    ur: "© 2026 vocv — جملہ حقوق محفوظ ہیں",
    it: "© 2026 vocv — Tutti i diritti riservati",
  },
  "landing.video.title": {
    en: "Watch it in action",
    ar: "شاهدها وهي تعمل",
    ur: "اسے عمل میں دیکھیں",
    it: "Guardalo in azione",
  },
  "landing.video.subtitle": {
    en: "From voice to finished CV in under 5 minutes.",
    ar: "من الصوت إلى سيرة ذاتية جاهزة في أقل من ٥ دقائق.",
    ur: "آواز سے مکمل CV تک، 5 منٹ سے کم میں۔",
    it: "Dalla voce al CV finito in meno di 5 minuti.",
  },

  // Samples gallery
  "samples.link": {
    en: "See sample CVs",
    ar: "اطّلع على نماذج السير الذاتية",
    ur: "نمونہ CVs دیکھیں",
    it: "Guarda CV di esempio",
  },
  "samples.title": {
    en: "See what your CV will look like",
    ar: "شاهد كيف ستبدو سيرتك الذاتية",
    ur: "دیکھیں آپ کا CV کیسا نظر آئے گا",
    it: "Guarda come apparirà il tuo CV",
  },
  "samples.subtitle": {
    en: "Real examples built from a voice recording. Choose any style after you finish.",
    ar: "أمثلة حقيقية أُنشئت من تسجيل صوتي. اختر أي نمط بعد الانتهاء.",
    ur: "آواز کی ریکارڈنگ سے بنے حقیقی نمونے۔ مکمل کرنے کے بعد کوئی بھی انداز منتخب کریں۔",
    it: "Esempi reali creati da una registrazione vocale. Scegli lo stile che preferisci alla fine.",
  },
  "samples.free": { en: "Free", ar: "مجاني", ur: "مفت", it: "Gratis" },
  "samples.premium": { en: "Premium", ar: "مدفوع", ur: "پریمیم", it: "Premium" },
  "samples.comingSoon": {
    en: "Coming soon",
    ar: "قريباً",
    ur: "جلد آ رہا ہے",
    it: "Prossimamente",
  },
  "samples.cta": {
    en: "Create your CV free",
    ar: "أنشئ سيرتك مجاناً",
    ur: "اپنا CV مفت بنائیں",
    it: "Crea il tuo CV gratis",
  },

  "landing.steps.title": {
    en: "How it works",
    ar: "كيف يعمل",
    ur: "یہ کیسے کام کرتا ہے",
    it: "Come funziona",
  },
  "landing.step1.title": {
    en: "Answer Simple Voice Questions",
    ar: "أجب على أسئلة صوتية بسيطة",
    ur: "آسان آواز کے سوالات کا جواب دیں",
    it: "Rispondi a semplici domande vocali",
  },
  "landing.step1.desc": {
    en: "Speak naturally in your own language. No typing.",
    ar: "تحدث بلغتك بطريقة طبيعية. لا حاجة للكتابة.",
    ur: "اپنی زبان میں قدرتی طور پر بولیں۔ کوئی ٹائپنگ نہیں۔",
    it: "Parla in modo naturale nella tua lingua. Niente digitazione.",
  },
  "landing.step2.title": {
    en: "AI Writes Your CV",
    ar: "الذكاء الاصطناعي يكتب سيرتك",
    ur: "AI آپ کا CV لکھتا ہے",
    it: "L'IA scrive il tuo CV",
  },
  "landing.step2.desc": {
    en: "We turn your answers into a polished, professional CV.",
    ar: "نحول إجاباتك إلى سيرة ذاتية احترافية ومنسقة.",
    ur: "ہم آپ کے جوابات کو ایک پیشہ ورانہ CV میں تبدیل کرتے ہیں۔",
    it: "Trasformiamo le tue risposte in un CV professionale e curato.",
  },
  "landing.step3.title": {
    en: "Download & Apply",
    ar: "حمّل وتقدّم",
    ur: "ڈاؤن لوڈ کریں اور درخواست دیں",
    it: "Scarica e candidati",
  },
  "landing.step3.desc": {
    en: "Get your CV as a PDF and start applying for jobs.",
    ar: "احصل على سيرتك بصيغة PDF وابدأ بالتقديم على الوظائف.",
    ur: "اپنا CV PDF میں حاصل کریں اور نوکریوں کے لیے درخواست دینا شروع کریں۔",
    it: "Ricevi il tuo CV in PDF e inizia a candidarti.",
  },

  "landing.testimonials.title": {
    en: "Real workers, real results",
    ar: "عمّال حقيقيون، نتائج حقيقية",
    ur: "حقیقی کارکن، حقیقی نتائج",
    it: "Lavoratori veri, risultati veri",
  },
  "landing.testimonial.1": {
    en: "I never knew how to write a CV. VoiceCV made me feel confident. I got a job in 2 weeks!",
    ar: "لم أكن أعرف كيف أكتب سيرة ذاتية. منحتني VoiceCV الثقة، وحصلت على وظيفة خلال أسبوعين!",
    ur: "میں CV لکھنا نہیں جانتا تھا۔ VoiceCV نے مجھے اعتماد دیا۔ 2 ہفتوں میں نوکری مل گئی!",
    it: "Non sapevo come scrivere un CV. VoiceCV mi ha dato fiducia. Ho trovato lavoro in 2 settimane!",
  },
  "landing.testimonial.1.name": {
    en: "Ahmad — Construction Worker, Riyadh",
    ar: "أحمد — عامل بناء، الرياض",
    ur: "احمد — تعمیراتی کارکن، ریاض",
    it: "Ahmad — Operaio edile, Riyadh",
  },
  "landing.testimonial.2": {
    en: "The Arabic option was perfect. The CV looked so professional, I couldn't believe I made it myself.",
    ar: "كان الخيار العربي مثالياً. بدت السيرة احترافية جداً، لم أصدق أنني صنعتها بنفسي.",
    ur: "عربی آپشن بہترین تھا۔ CV اتنا پیشہ ورانہ لگ رہا تھا کہ یقین نہیں آیا یہ میں نے بنایا ہے۔",
    it: "L'opzione in arabo era perfetta. Il CV sembrava così professionale che non credevo di averlo fatto io.",
  },
  "landing.testimonial.2.name": {
    en: "Fatima — Job Seeker, Jeddah",
    ar: "فاطمة — باحثة عن عمل، جدة",
    ur: "فاطمہ — ملازمت کی متلاشی، جدہ",
    it: "Fatima — In cerca di lavoro, Jeddah",
  },
  "landing.testimonial.3": {
    en: "Simple, fast, and it actually worked. The employer was impressed by my CV.",
    ar: "بسيط، سريع، ونجح فعلاً. أُعجب صاحب العمل بسيرتي الذاتية.",
    ur: "سادہ، تیز، اور واقعی کام کیا۔ آجر میرے CV سے متاثر ہوا۔",
    it: "Semplice, veloce e ha funzionato davvero. Il datore di lavoro è rimasto colpito dal mio CV.",
  },
  "landing.testimonial.3.name": {
    en: "Ravi — Expat Worker, Dammam",
    ar: "رافي — عامل وافد، الدمام",
    ur: "روی — تارکِ وطن کارکن، دمام",
    it: "Ravi — Lavoratore straniero, Dammam",
  },

  "landing.trust.powered": {
    en: "Developed by DevVibe AI",
    ar: "من تطوير DevVibe AI",
    ur: "DevVibe AI کا تیار کردہ",
    it: "Sviluppato da DevVibe AI",
  },
  "landing.samples.caption": {
    en: "Real CVs, ready in minutes",
    ar: "سير ذاتية حقيقية، جاهزة خلال دقائق",
    ur: "حقیقی CVs، چند منٹوں میں تیار",
    it: "CV reali, pronti in pochi minuti",
  },
  "landing.trust.vision": {
    en: "Speak your future",
    ar: "تحدّث عن مستقبلك",
    ur: "اپنے مستقبل کی بات کریں",
    it: "Dai voce al tuo futuro",
  },
  "landing.trust.nocode": {
    en: "Built without barriers",
    ar: "بلا حدود وبلا حواجز",
    ur: "بغیر کسی رکاوٹ کے",
    it: "Costruito senza barriere",
  },

  // Auth
  "auth.login.title": {
    en: "Welcome back",
    ar: "مرحباً بعودتك",
    ur: "خوش آمدید",
    it: "Bentornato",
  },
  "auth.signup.title": {
    en: "Create your account",
    ar: "أنشئ حسابك",
    ur: "اپنا اکاؤنٹ بنائیں",
    it: "Crea il tuo account",
  },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني", ur: "ای میل", it: "Email" },
  "auth.password": { en: "Password", ar: "كلمة المرور", ur: "پاس ورڈ", it: "Password" },
  "auth.fullName": { en: "Full name", ar: "الاسم الكامل", ur: "پورا نام", it: "Nome completo" },
  "auth.signIn": { en: "Sign in", ar: "تسجيل الدخول", ur: "سائن ان", it: "Accedi" },
  "auth.signUp": { en: "Sign up", ar: "إنشاء حساب", ur: "سائن اپ", it: "Registrati" },
  "auth.signOut": { en: "Sign out", ar: "تسجيل الخروج", ur: "سائن آؤٹ", it: "Esci" },
  "auth.haveAccount": {
    en: "Already have an account?",
    ar: "لديك حساب بالفعل؟",
    ur: "کیا پہلے سے اکاؤنٹ ہے؟",
    it: "Hai già un account?",
  },
  "auth.noAccount": {
    en: "Don't have an account?",
    ar: "ليس لديك حساب؟",
    ur: "اکاؤنٹ نہیں ہے؟",
    it: "Non hai un account?",
  },
  "auth.forgot.link": {
    en: "Forgot password?",
    ar: "نسيت كلمة المرور؟",
    ur: "پاس ورڈ بھول گئے؟",
    it: "Password dimenticata?",
  },
  "auth.forgot.title": {
    en: "Reset your password",
    ar: "إعادة تعيين كلمة المرور",
    ur: "پاس ورڈ ری سیٹ کریں",
    it: "Reimposta la password",
  },
  "auth.forgot.desc": {
    en: "Enter your email and we'll send you a reset link.",
    ar: "أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.",
    ur: "اپنا ای میل درج کریں، ہم ری سیٹ لنک بھیجیں گے۔",
    it: "Inserisci la tua email e ti invieremo un link per reimpostarla.",
  },
  "auth.forgot.send": {
    en: "Send reset link",
    ar: "إرسال الرابط",
    ur: "ری سیٹ لنک بھیجیں",
    it: "Invia il link",
  },
  "auth.forgot.sent": {
    en: "Check your inbox",
    ar: "تحقق من بريدك الوارد",
    ur: "اپنا انباکس چیک کریں",
    it: "Controlla la tua casella",
  },
  "auth.forgot.checkInbox": {
    en: "If an account exists for that email, a password reset link is on its way. The link expires in 1 hour.",
    ar: "إذا كان هناك حساب بهذا البريد، فقد أُرسل رابط إعادة التعيين. تنتهي صلاحية الرابط خلال ساعة واحدة.",
    ur: "اگر اس ای میل پر کوئی اکاؤنٹ ہے تو ری سیٹ لنک بھیج دیا گیا ہے۔ لنک 1 گھنٹے میں ختم ہو جائے گا۔",
    it: "Se esiste un account con questa email, il link per reimpostare la password è in arrivo. Il link scade tra 1 ora.",
  },
  "auth.forgot.backToLogin": {
    en: "Back to sign in",
    ar: "العودة إلى تسجيل الدخول",
    ur: "سائن ان پر واپس جائیں",
    it: "Torna all'accesso",
  },
  "auth.reset.title": {
    en: "Choose a new password",
    ar: "اختر كلمة مرور جديدة",
    ur: "نیا پاس ورڈ منتخب کریں",
    it: "Scegli una nuova password",
  },
  "auth.reset.desc": {
    en: "Pick something at least 6 characters long.",
    ar: "اختر كلمة مرور لا تقل عن 6 أحرف.",
    ur: "کم از کم 6 حروف کا پاس ورڈ منتخب کریں۔",
    it: "Scegline una di almeno 6 caratteri.",
  },
  "auth.reset.waiting": {
    en: "Verifying your reset link…",
    ar: "نتحقق من رابط إعادة التعيين…",
    ur: "ری سیٹ لنک کی تصدیق…",
    it: "Verifica del link in corso…",
  },
  "auth.reset.newPassword": {
    en: "New password",
    ar: "كلمة المرور الجديدة",
    ur: "نیا پاس ورڈ",
    it: "Nuova password",
  },
  "auth.reset.confirm": {
    en: "Confirm new password",
    ar: "تأكيد كلمة المرور",
    ur: "پاس ورڈ کی تصدیق کریں",
    it: "Conferma la nuova password",
  },
  "auth.reset.update": {
    en: "Update password",
    ar: "تحديث كلمة المرور",
    ur: "پاس ورڈ اپڈیٹ کریں",
    it: "Aggiorna la password",
  },
  "auth.signup.alreadyExists": {
    en: "An account already exists with this email. Try signing in instead, or reset your password.",
    ar: "يوجد حساب مسجل بهذا البريد. حاول تسجيل الدخول أو إعادة تعيين كلمة المرور.",
    ur: "اس ای میل پر اکاؤنٹ پہلے سے موجود ہے۔ سائن ان کریں یا پاس ورڈ ری سیٹ کریں۔",
    it: "Esiste già un account con questa email. Prova ad accedere oppure reimposta la password.",
  },

  // Dashboard
  "dashboard.welcome": { en: "Welcome", ar: "أهلاً", ur: "خوش آمدید", it: "Benvenuto" },
  "dashboard.create": {
    en: "Create New CV",
    ar: "أنشئ سيرة ذاتية جديدة",
    ur: "نیا CV بنائیں",
    it: "Crea nuovo CV",
  },
  "dashboard.myCvs": { en: "My CVs", ar: "سيرتي الذاتية", ur: "میرے CVs", it: "I miei CV" },
  "dashboard.empty.title": {
    en: "Create your first CV in 5 minutes",
    ar: "أنشئ أول سيرة ذاتية في ٥ دقائق",
    ur: "5 منٹ میں اپنا پہلا CV بنائیں",
    it: "Crea il tuo primo CV in 5 minuti",
  },
  "dashboard.empty.desc": {
    en: "Answer a few voice questions and let AI do the rest.",
    ar: "أجب عن بعض الأسئلة الصوتية ودع الذكاء الاصطناعي يقوم بالباقي.",
    ur: "چند آواز کے سوالات کا جواب دیں، باقی AI کرے گا۔",
    it: "Rispondi a poche domande vocali e lascia fare il resto all'IA.",
  },
  "dashboard.delete": { en: "Delete CV", ar: "حذف السيرة", ur: "CV حذف کریں", it: "Elimina CV" },
  "dashboard.delete.confirmTitle": {
    en: "Delete this CV?",
    ar: "حذف هذه السيرة الذاتية؟",
    ur: "یہ CV حذف کریں؟",
    it: "Eliminare questo CV?",
  },
  "dashboard.delete.confirmDesc": {
    en: "This permanently removes the CV. This can't be undone.",
    ar: "سيؤدي هذا إلى حذف السيرة الذاتية نهائياً. لا يمكن التراجع عن هذا.",
    ur: "یہ CV مستقل طور پر حذف ہو جائے گا۔ اسے واپس نہیں کیا جا سکتا۔",
    it: "Questa azione rimuove definitivamente il CV. Non può essere annullata.",
  },
  "dashboard.delete.confirm": { en: "Delete", ar: "حذف", ur: "حذف کریں", it: "Elimina" },
  "dashboard.delete.success": {
    en: "CV deleted",
    ar: "تم حذف السيرة الذاتية",
    ur: "CV حذف ہو گیا",
    it: "CV eliminato",
  },
  "dashboard.delete.error": {
    en: "Couldn't delete the CV. Please try again.",
    ar: "تعذّر حذف السيرة الذاتية. حاول مرة أخرى.",
    ur: "CV حذف نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
    it: "Impossibile eliminare il CV. Riprova.",
  },
  "dashboard.download.success": {
    en: "PDF downloaded",
    ar: "تم تنزيل ملف PDF",
    ur: "PDF ڈاؤن لوڈ ہو گیا",
    it: "PDF scaricato",
  },
  "dashboard.download.error": {
    en: "Couldn't download the PDF. Please try again.",
    ar: "تعذّر تنزيل ملف PDF. حاول مرة أخرى.",
    ur: "PDF ڈاؤن لوڈ نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
    it: "Impossibile scaricare il PDF. Riprova.",
  },

  // Premium
  "premium.title": {
    en: "Premium Pack",
    ar: "الباقة المميزة",
    ur: "پریمیم پیک",
    it: "Pacchetto Premium",
  },
  "premium.tagline": {
    en: "2 premium CV designs + a professional cover letter — for $5",
    ar: "تصميمان مميزان للسيرة الذاتية + خطاب تقديم احترافي — مقابل 5$",
    ur: "2 پریمیم CV ڈیزائن + پیشہ ورانہ کور لیٹر — صرف $5 میں",
    it: "2 design CV premium + una lettera di presentazione professionale — a $5",
  },
  "premium.cta": {
    en: "Unlock Premium — $5",
    ar: "افتح المميز — 5$",
    ur: "پریمیم کھولیں — $5",
    it: "Sblocca Premium — $5",
  },
  "premium.cvCredits": {
    en: "premium CV credits",
    ar: "رصيد سير مميزة",
    ur: "پریمیم CV کریڈٹس",
    it: "crediti CV premium",
  },
  "premium.letterCredits": {
    en: "cover letter credits",
    ar: "رصيد خطابات تقديم",
    ur: "کور لیٹر کریڈٹس",
    it: "crediti lettera",
  },
  "premium.success": {
    en: "Payment successful — your premium credits are ready!",
    ar: "تم الدفع بنجاح — رصيدك المميز جاهز!",
    ur: "ادائیگی کامیاب — آپ کے پریمیم کریڈٹس تیار ہیں!",
    it: "Pagamento riuscito — i tuoi crediti premium sono pronti!",
  },
  "premium.cancel": {
    en: "Checkout canceled.",
    ar: "تم إلغاء الدفع.",
    ur: "چیک آؤٹ منسوخ ہو گیا۔",
    it: "Pagamento annullato.",
  },
  "premium.checkoutError": {
    en: "Couldn't start checkout. Please try again.",
    ar: "تعذّر بدء الدفع. حاول مرة أخرى.",
    ur: "چیک آؤٹ شروع نہیں ہو سکا۔ دوبارہ کوشش کریں۔",
    it: "Impossibile avviare il pagamento. Riprova.",
  },

  // Cover letter
  "letter.title": {
    en: "Cover Letter",
    ar: "خطاب التقديم",
    ur: "کور لیٹر",
    it: "Lettera di presentazione",
  },
  "letter.intro": {
    en: "Stand out with a tailored cover letter written from your CV.",
    ar: "تميّز بخطاب تقديم مخصص مكتوب من سيرتك الذاتية.",
    ur: "اپنے CV سے لکھے گئے ذاتی کور لیٹر کے ساتھ نمایاں ہوں۔",
    it: "Distinguiti con una lettera di presentazione su misura, scritta dal tuo CV.",
  },
  "letter.badge": { en: "Premium", ar: "مميز", ur: "پریمیم", it: "Premium" },
  "letter.targetRole": {
    en: "Target role (optional)",
    ar: "الوظيفة المستهدفة (اختياري)",
    ur: "ہدف عہدہ (اختیاری)",
    it: "Ruolo desiderato (facoltativo)",
  },
  "letter.company": {
    en: "Company (optional)",
    ar: "الشركة (اختياري)",
    ur: "کمپنی (اختیاری)",
    it: "Azienda (facoltativo)",
  },
  "letter.generate": {
    en: "Generate cover letter",
    ar: "إنشاء خطاب التقديم",
    ur: "کور لیٹر بنائیں",
    it: "Genera la lettera",
  },
  "letter.regenerate": {
    en: "Regenerate",
    ar: "إعادة الإنشاء",
    ur: "دوبارہ بنائیں",
    it: "Rigenera",
  },
  "letter.download": {
    en: "Download cover letter",
    ar: "تنزيل خطاب التقديم",
    ur: "کور لیٹر ڈاؤن لوڈ کریں",
    it: "Scarica la lettera",
  },
  "letter.generating": {
    en: "Writing your cover letter…",
    ar: "نكتب خطاب التقديم…",
    ur: "آپ کا کور لیٹر لکھا جا رہا ہے…",
    it: "Stiamo scrivendo la tua lettera…",
  },
  "letter.saved": { en: "Saved", ar: "تم الحفظ", ur: "محفوظ ہو گیا", it: "Salvato" },
  "letter.needPremium": {
    en: "You need a cover letter credit. Unlock Premium on your dashboard.",
    ar: "تحتاج إلى رصيد خطاب تقديم. افتح المميز من لوحة التحكم.",
    ur: "آپ کو کور لیٹر کریڈٹ چاہیے۔ ڈیش بورڈ سے پریمیم کھولیں۔",
    it: "Ti serve un credito lettera. Sblocca Premium dalla dashboard.",
  },
  "letter.error": {
    en: "Couldn't generate the cover letter. Please try again.",
    ar: "تعذّر إنشاء خطاب التقديم. حاول مرة أخرى.",
    ur: "کور لیٹر نہیں بن سکا۔ دوبارہ کوشش کریں۔",
    it: "Impossibile generare la lettera. Riprova.",
  },

  // Status
  "status.processing": {
    en: "Processing",
    ar: "قيد المعالجة",
    ur: "پراسیسنگ",
    it: "In elaborazione",
  },
  "status.ready": { en: "Ready", ar: "جاهزة", ur: "تیار", it: "Pronto" },
  "status.exported": {
    en: "Exported",
    ar: "تم التصدير",
    ur: "ایکسپورٹ ہو گیا",
    it: "Esportato",
  },
  "status.failed": { en: "Failed", ar: "فشلت", ur: "ناکام", it: "Non riuscito" },

  // Recorder
  "rec.questionOf": {
    en: "Question {n} of {total}",
    ar: "السؤال {n} من {total}",
    ur: "سوال {n} از {total}",
    it: "Domanda {n} di {total}",
  },
  "rec.start": {
    en: "Start Recording",
    ar: "ابدأ التسجيل",
    ur: "ریکارڈنگ شروع کریں",
    it: "Inizia a registrare",
  },
  "rec.listen": {
    en: "Listen to the question",
    ar: "استمع إلى السؤال",
    ur: "سوال سنیں",
    it: "Ascolta la domanda",
  },
  "rec.idleHint": {
    en: "Tap the mic and answer out loud",
    ar: "اضغط على الميكروفون وأجب بصوتك",
    ur: "مائیک دبائیں اور بول کر جواب دیں",
    it: "Tocca il microfono e rispondi a voce",
  },
  "rec.outputLang.title": {
    en: "What language should your CV be in?",
    ar: "بأي لغة تريد سيرتك الذاتية؟",
    ur: "آپ اپنا CV کس زبان میں چاہتے ہیں؟",
    it: "In che lingua vuoi il tuo CV?",
  },
  "rec.outputLang.desc": {
    en: "Speak in any language — choose the language for your finished CV.",
    ar: "تحدّث بأي لغة — اختر لغة سيرتك الذاتية النهائية.",
    ur: "کسی بھی زبان میں بولیں — اپنے حتمی CV کی زبان منتخب کریں۔",
    it: "Parla in qualsiasi lingua — scegli la lingua del CV finale.",
  },
  "rec.stop": { en: "Stop", ar: "إيقاف", ur: "روکیں", it: "Ferma" },
  "rec.rerecord": {
    en: "Re-record",
    ar: "إعادة التسجيل",
    ur: "دوبارہ ریکارڈ کریں",
    it: "Registra di nuovo",
  },
  "rec.next": { en: "Next Question", ar: "السؤال التالي", ur: "اگلا سوال", it: "Domanda successiva" },
  "rec.skip": {
    en: "Skip this question",
    ar: "تخطي هذا السؤال",
    ur: "یہ سوال چھوڑیں",
    it: "Salta questa domanda",
  },
  "rec.submit": {
    en: "Submit All Answers",
    ar: "إرسال جميع الإجابات",
    ur: "تمام جوابات جمع کرائیں",
    it: "Invia tutte le risposte",
  },
  "rec.micDenied": {
    en: "Microphone permission denied. Please allow access in your browser settings.",
    ar: "تم رفض الإذن للميكروفون. الرجاء السماح بالوصول من إعدادات المتصفح.",
    ur: "مائیکروفون کی اجازت مسترد کر دی گئی۔ براہ کرم اپنے براؤزر کی ترتیبات سے اجازت دیں۔",
    it: "Permesso microfono negato. Consenti l'accesso nelle impostazioni del browser.",
  },
  "rec.unsupported": {
    en: "Audio recording not supported. Please use Chrome or Firefox.",
    ar: "تسجيل الصوت غير مدعوم. الرجاء استخدام Chrome أو Firefox.",
    ur: "آڈیو ریکارڈنگ سپورٹ نہیں ہے۔ براہ کرم Chrome یا Firefox استعمال کریں۔",
    it: "Registrazione audio non supportata. Usa Chrome o Firefox.",
  },
  "rec.processing.transcribing": {
    en: "Transcribing audio…",
    ar: "جارٍ تحويل الصوت إلى نص…",
    ur: "آڈیو کو متن میں تبدیل کیا جا رہا ہے…",
    it: "Trascrizione dell'audio…",
  },
  "rec.processing.understanding": {
    en: "Reading your experience…",
    ar: "نقرأ خبرتك…",
    ur: "آپ کا تجربہ پڑھ رہے ہیں…",
    it: "Stiamo leggendo la tua esperienza…",
  },
  "rec.processing.writing": {
    en: "Writing your CV…",
    ar: "نكتب سيرتك الذاتية…",
    ur: "آپ کا CV لکھ رہے ہیں…",
    it: "Stiamo scrivendo il tuo CV…",
  },
  "rec.processing.done": {
    en: "Your CV is ready!",
    ar: "سيرتك الذاتية جاهزة!",
    ur: "آپ کا CV تیار ہے!",
    it: "Il tuo CV è pronto!",
  },
  "rec.viewCv": { en: "View My CV", ar: "عرض سيرتي", ur: "میرا CV دیکھیں", it: "Vedi il mio CV" },

  // CV sections
  "cv.objective": { en: "Objective", ar: "الهدف المهني", ur: "مقصد", it: "Obiettivo" },
  "cv.experience": {
    en: "Work Experience",
    ar: "الخبرة العملية",
    ur: "کام کا تجربہ",
    it: "Esperienza lavorativa",
  },
  "cv.education": { en: "Education", ar: "التعليم", ur: "تعلیم", it: "Istruzione" },
  "cv.certificates": {
    en: "Certificates & Training",
    ar: "الشهادات والتدريب",
    ur: "سرٹیفکیٹ اور تربیت",
    it: "Certificati e formazione",
  },
  "cv.skills": { en: "Skills", ar: "المهارات", ur: "مہارتیں", it: "Competenze" },
  "cv.languages": { en: "Languages", ar: "اللغات", ur: "زبانیں", it: "Lingue" },
  "cv.hobbies": { en: "Hobbies", ar: "الهوايات", ur: "مشاغل", it: "Hobby" },
  "cv.achievement": {
    en: "Key Achievements",
    ar: "أبرز الإنجازات",
    ur: "اہم کامیابیاں",
    it: "Risultati principali",
  },
  "cv.contact": { en: "Contact", ar: "التواصل", ur: "رابطہ", it: "Contatti" },
  "cv.nationality": { en: "Nationality", ar: "الجنسية", ur: "قومیت", it: "Nazionalità" },
  "cv.location": { en: "Location", ar: "الموقع", ur: "مقام", it: "Località" },
  "cv.socials": { en: "Links", ar: "روابط", ur: "لنکس", it: "Link" },
  "cv.download": {
    en: "Download PDF",
    ar: "تحميل PDF",
    ur: "PDF ڈاؤن لوڈ کریں",
    it: "Scarica PDF",
  },
  "cv.edit": { en: "Edit", ar: "تعديل", ur: "ترمیم", it: "Modifica" },
  "cv.done": { en: "Done", ar: "تم", ur: "ہو گیا", it: "Fatto" },
  "cv.regenerate": {
    en: "Regenerate with AI",
    ar: "إعادة الإنشاء بالذكاء الاصطناعي",
    ur: "AI سے دوبارہ بنائیں",
    it: "Rigenera con l'IA",
  },

  // Onboarding
  "onb.title": {
    en: "What language would you like to use?",
    ar: "ما اللغة التي ترغب باستخدامها؟",
    ur: "آپ کون سی زبان استعمال کرنا چاہیں گے؟",
    it: "Quale lingua vuoi usare?",
  },
  "onb.continue": { en: "Continue", ar: "متابعة", ur: "جاری رکھیں", it: "Continua" },

  // Common
  "common.back": { en: "Back", ar: "رجوع", ur: "واپس", it: "Indietro" },
  "common.cancel": { en: "Cancel", ar: "إلغاء", ur: "منسوخ", it: "Annulla" },
  "common.save": { en: "Save", ar: "حفظ", ur: "محفوظ کریں", it: "Salva" },
  "common.retry": {
    en: "Retry",
    ar: "إعادة المحاولة",
    ur: "دوبارہ کوشش کریں",
    it: "Riprova",
  },
  "common.loading": {
    en: "Loading…",
    ar: "جارٍ التحميل…",
    ur: "لوڈ ہو رہا ہے…",
    it: "Caricamento…",
  },

  // Editor — add / remove
  "edit.add.skill": { en: "Add skill", ar: "إضافة مهارة", ur: "مہارت شامل کریں", it: "Aggiungi competenza" },
  "edit.add.language": {
    en: "Add language",
    ar: "إضافة لغة",
    ur: "زبان شامل کریں",
    it: "Aggiungi lingua",
  },
  "edit.add.hobby": {
    en: "Add hobby",
    ar: "إضافة هواية",
    ur: "مشغلہ شامل کریں",
    it: "Aggiungi hobby",
  },
  "edit.add.experience": {
    en: "Add experience",
    ar: "إضافة خبرة",
    ur: "تجربہ شامل کریں",
    it: "Aggiungi esperienza",
  },
  "edit.add.education": {
    en: "Add education",
    ar: "إضافة تعليم",
    ur: "تعلیم شامل کریں",
    it: "Aggiungi istruzione",
  },
  "edit.add.certificate": {
    en: "Add certificate",
    ar: "إضافة شهادة",
    ur: "سرٹیفکیٹ شامل کریں",
    it: "Aggiungi certificato",
  },
  "edit.add.achievement": {
    en: "Add achievement",
    ar: "إضافة إنجاز",
    ur: "کامیابی شامل کریں",
    it: "Aggiungi risultato",
  },
  "edit.add.social": {
    en: "Add link",
    ar: "إضافة رابط",
    ur: "لنک شامل کریں",
    it: "Aggiungi link",
  },
  "edit.remove": { en: "Remove", ar: "حذف", ur: "حذف کریں", it: "Rimuovi" },

  "edit.proficiency.beginner": {
    en: "Beginner",
    ar: "مبتدئ",
    ur: "ابتدائی",
    it: "Principiante",
  },
  "edit.proficiency.conversational": {
    en: "Conversational",
    ar: "متوسط",
    ur: "گفتگو کی سطح",
    it: "Intermedio",
  },
  "edit.proficiency.fluent": {
    en: "Fluent",
    ar: "متقدم",
    ur: "روانی",
    it: "Fluente",
  },
  "edit.placeholder.skill": { en: "e.g. forklift driving", ar: "مثال: قيادة الرافعة", ur: "مثال: فورک لفٹ چلانا", it: "es. guida del muletto" },
  "edit.placeholder.hobby": { en: "e.g. reading", ar: "مثال: القراءة", ur: "مثال: مطالعہ", it: "es. lettura" },
  "edit.placeholder.achievement": {
    en: "e.g. Employee of the Month 2023",
    ar: "مثال: موظف الشهر 2023",
    ur: "مثال: ملازم ماہ 2023",
    it: "es. Dipendente del mese 2023",
  },
  "edit.placeholder.langName": { en: "Language", ar: "اللغة", ur: "زبان", it: "Lingua" },
  "edit.placeholder.city": { en: "City", ar: "المدينة", ur: "شہر", it: "Città" },
  "edit.placeholder.country": { en: "Country", ar: "الدولة", ur: "ملک", it: "Paese" },
  "edit.placeholder.socialUrl": {
    en: "https://github.com/yourname",
    ar: "https://github.com/yourname",
    ur: "https://github.com/yourname",
    it: "https://github.com/yourname",
  },
  "edit.hint.bullets": {
    en: "Tip: put each bullet on its own line.",
    ar: "نصيحة: ضع كل نقطة في سطر منفصل.",
    ur: "تجویز: ہر نکتہ الگ سطر میں لکھیں۔",
    it: "Suggerimento: scrivi ogni punto su una riga separata.",
  },
  "edit.banner": {
    en: "Edit mode — click any field to change it, or use the + buttons to add more.",
    ar: "وضع التعديل — انقر على أي حقل لتغييره، أو استخدم زر + لإضافة المزيد.",
    ur: "ایڈٹ موڈ — کسی بھی فیلڈ پر کلک کر کے تبدیل کریں، یا + بٹن سے مزید شامل کریں۔",
    it: "Modalità modifica — clicca su un campo per cambiarlo, o usa i pulsanti + per aggiungerne altri.",
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
