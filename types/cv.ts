export type Language = "en" | "ar" | "ur" | "it";

/**
 * Languages a CV can be *written in*. A user can record in any language but
 * choose the CV output among these. Limited to LTR/Latin scripts for now;
 * Arabic/Urdu output is deferred until the PDF templates are RTL-verified.
 */
export const OUTPUT_LANGUAGES: Language[] = ["en", "it"];

export type CVStatus = "processing" | "ready" | "exported" | "failed";

export type TemplateId = "modern" | "minimalist" | "classic" | "executive";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  /** Whether this template is part of the premium plan. */
  premium: boolean;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Navy sidebar with teal accents — the default.",
    premium: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Single column, lots of whitespace, light typography.",
    premium: false,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Centered, traditional serif layout.",
    premium: true,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bold navy header with accent bar.",
    premium: true,
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "modern";

export interface CVPersonal {
  full_name: string;
  /** Professional title / headline shown under the name, e.g. "Data Analyst". */
  job_title: string;
  nationality: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  /**
   * Optional photo shown on the CV. Opt-in per CV: a URL means "show this photo",
   * empty/undefined means no photo. Set from the user's Profile photo via the
   * editor toggle; never populated by AI generation.
   */
  photo_url?: string;
}

export interface CVSocialLink {
  url: string;
}

export interface CVExperienceItem {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface CVEducationItem {
  institution: string;
  degree: string;
  year: string;
}

export interface CVCertificateItem {
  name: string;
  issuer: string;
  year: string;
}

export interface CVLanguageItem {
  name: string;
  proficiency: string; // beginner | conversational | fluent (free-text so AI can localize)
}

export interface CVData {
  personal: CVPersonal;
  socials: CVSocialLink[];
  objective: string;
  experience: CVExperienceItem[];
  education: CVEducationItem[];
  certificates: CVCertificateItem[];
  skills: string[];
  languages: CVLanguageItem[];
  hobbies: string[];
  /** Simple achievements / awards, e.g. "Employee of the Month 2023". */
  achievements: string[];
}

export interface CVRecord {
  id: string;
  user_id: string;
  title: string | null;
  audio_url: string | null;
  transcript: string | null;
  cv_data: CVData | null;
  template: TemplateId | null;
  /** Language the CV text is written in (drives preview + PDF headings). */
  language: Language | null;
  /** Premium templates allowed on this CV (one premium-CV credit spent). */
  premium_unlocked: boolean;
  /** Generated professional cover letter, if any. */
  cover_letter: string | null;
  /** Cover-letter download unlocked (one cover-letter credit spent). */
  cover_letter_unlocked: boolean;
  status: CVStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  language: Language;
  cvs_created: number;
  cv_credits: number;
  premium_cv_credits: number;
  cover_letter_credits: number;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  language: Language;
  order_index: number;
  question_text: string;
  field_key: string;
}

export interface QAPair {
  question: string;
  answer: string;
  field_key: string;
}

export const EMPTY_CV: CVData = {
  personal: {
    full_name: "",
    job_title: "",
    nationality: "",
    city: "",
    country: "",
    email: "",
    phone: "",
  },
  socials: [],
  objective: "",
  experience: [],
  education: [],
  certificates: [],
  skills: [],
  languages: [],
  hobbies: [],
  achievements: [],
};

// Re-exported for backwards compatibility. New code should import directly
// from `@/lib/cv/migrate` so this `types/` module is type-only.
export { migrateCvData } from "@/lib/cv/migrate";
