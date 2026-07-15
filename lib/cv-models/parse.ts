/**
 * Shared CV JSON parser — extracts the JSON object from a model's raw text and
 * backfills every field so a sparse/partial response can't crash the renderer.
 * Used by every provider so all models yield the same CVData shape.
 */

import type { CVData } from "@/types/cv";

export function parseCVJson(raw: string): CVData {
  const text = raw.trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Model response did not contain JSON");
  }

  const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as CVData;
  return {
    personal: {
      full_name: parsed.personal?.full_name ?? "",
      job_title: parsed.personal?.job_title ?? "",
      nationality: parsed.personal?.nationality ?? "",
      city: parsed.personal?.city ?? "",
      country: parsed.personal?.country ?? "",
      email: parsed.personal?.email ?? "",
      phone: parsed.personal?.phone ?? "",
    },
    socials: Array.isArray(parsed.socials) ? parsed.socials : [],
    objective: parsed.objective ?? "",
    experience: parsed.experience ?? [],
    education: parsed.education ?? [],
    certificates: parsed.certificates ?? [],
    skills: parsed.skills ?? [],
    languages: parsed.languages ?? [],
    hobbies: parsed.hobbies ?? [],
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
  };
}
