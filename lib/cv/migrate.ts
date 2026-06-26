/**
 * CV data migration — backfill v2 schema fields on rows that were
 * created under v1 (or by a future client we don't yet know about).
 *
 * SINGLE source of truth. Callers (the CV view page, CVPreview component,
 * PDF export route) all delegate to this function. Keep it pure + idempotent.
 */

import type { CVData, CVLanguageItem, CVPersonal, CVSocialLink } from "@/types/cv";

export function migrateCvData(raw: unknown): CVData {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<CVData> & {
    personal?: Partial<CVPersonal>;
    languages?: unknown;
  };

  const personal: CVPersonal = {
    full_name: src.personal?.full_name ?? "",
    nationality: src.personal?.nationality ?? "",
    city: src.personal?.city ?? "",
    country: src.personal?.country ?? "",
    email: src.personal?.email ?? "",
    phone: src.personal?.phone ?? "",
  };

  const socials: CVSocialLink[] = Array.isArray(src.socials)
    ? src.socials
        .map((entry): CVSocialLink => {
          if (typeof entry === "string") return { url: entry };
          if (entry && typeof entry === "object") {
            return { url: (entry as { url?: string }).url ?? "" };
          }
          return { url: "" };
        })
        .filter((s) => typeof s.url === "string")
    : [];

  // languages used to be string[]; normalize to {name, proficiency}[].
  let languages: CVLanguageItem[] = [];
  if (Array.isArray(src.languages)) {
    languages = src.languages.map((entry): CVLanguageItem => {
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
    socials,
    objective: src.objective ?? "",
    experience: Array.isArray(src.experience) ? src.experience : [],
    education: Array.isArray(src.education) ? src.education : [],
    certificates: Array.isArray(src.certificates) ? src.certificates : [],
    skills: Array.isArray(src.skills) ? src.skills : [],
    languages,
    hobbies: Array.isArray(src.hobbies) ? src.hobbies : [],
    achievements: migrateAchievements(src),
  };
}

// achievements used to be a single STAR object {situation,task,action,result};
// it's now a simple string[]. Collapse any legacy STAR object into one line so
// existing CVs keep their content.
function migrateAchievements(src: {
  achievements?: unknown;
  achievement?: unknown;
}): string[] {
  if (Array.isArray(src.achievements)) {
    return src.achievements.filter(
      (a): a is string => typeof a === "string" && a.trim().length > 0,
    );
  }
  const legacy = src.achievement;
  if (legacy && typeof legacy === "object") {
    const o = legacy as Record<string, unknown>;
    const parts = ["situation", "task", "action", "result"]
      .map((k) => (typeof o[k] === "string" ? (o[k] as string).trim() : ""))
      .filter(Boolean);
    return parts.length > 0 ? [parts.join(" ")] : [];
  }
  return [];
}
