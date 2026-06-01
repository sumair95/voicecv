export type Language = "en" | "ar";

export type CVStatus = "processing" | "ready" | "exported" | "failed";

export interface CVPersonal {
  full_name: string;
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

export interface CVData {
  personal: CVPersonal;
  objective: string;
  experience: CVExperienceItem[];
  education: CVEducationItem[];
  skills: string[];
  languages: string[];
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
  personal: { full_name: "", city: "", email: "", phone: "" },
  objective: "",
  experience: [],
  education: [],
  skills: [],
  languages: [],
};
