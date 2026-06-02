export type Language = "en" | "ar" | "ur" | "hi";

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
