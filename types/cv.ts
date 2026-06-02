export type Language = "en" | "ar" | "ur";

export type CVStatus = "processing" | "ready" | "exported" | "failed";

export interface CVPersonal {
  full_name: string;
  nationality: string;
  city: string;
  email: string;
  phone: string;
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

export interface CVAchievement {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface CVData {
  personal: CVPersonal;
  objective: string;
  experience: CVExperienceItem[];
  education: CVEducationItem[];
  certificates: CVCertificateItem[];
  skills: string[];
  languages: CVLanguageItem[];
  hobbies: string[];
  achievement: CVAchievement | null;
}

export interface CVRecord {
  id: string;
  user_id: string;
  title: string | null;
  audio_url: string | null;
  transcript: string | null;
  cv_data: CVData | null;
  status: CVStatus;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  language: Language;
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
  personal: { full_name: "", nationality: "", city: "", email: "", phone: "" },
  objective: "",
  experience: [],
  education: [],
  certificates: [],
  skills: [],
  languages: [],
  hobbies: [],
  achievement: null,
};

// Backfill missing fields on CVs that were saved under the v1 schema
// (before nationality, certificates, hobbies, achievement, structured languages).
// Always pass user data through this before handing it to render code.
export function migrateCvData(raw: unknown): CVData {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<CVData> & {
    personal?: Partial<CVPersonal>;
    languages?: unknown;
  };

  const personal: CVPersonal = {
    full_name: src.personal?.full_name ?? "",
    nationality: src.personal?.nationality ?? "",
    city: src.personal?.city ?? "",
    email: src.personal?.email ?? "",
    phone: src.personal?.phone ?? "",
  };

  // languages used to be string[]; normalize to {name, proficiency}[].
  let languages: CVLanguageItem[] = [];
  if (Array.isArray(src.languages)) {
    languages = src.languages.map((entry) => {
      if (typeof entry === "string") return { name: entry, proficiency: "" };
      if (entry && typeof entry === "object") {
        const obj = entry as Partial<CVLanguageItem>;
        return { name: obj.name ?? "", proficiency: obj.proficiency ?? "" };
      }
      return { name: String(entry ?? ""), proficiency: "" };
    });
  }

  return {
    personal,
    objective: src.objective ?? "",
    experience: Array.isArray(src.experience) ? src.experience : [],
    education: Array.isArray(src.education) ? src.education : [],
    certificates: Array.isArray(src.certificates) ? src.certificates : [],
    skills: Array.isArray(src.skills) ? src.skills : [],
    languages,
    hobbies: Array.isArray(src.hobbies) ? src.hobbies : [],
    achievement: src.achievement ?? null,
  };
}
