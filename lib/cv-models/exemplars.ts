/**
 * Retrieval for few-shot CV generation.
 *
 * Pulls the best human-approved CVs for a similar role + output language from
 * cv_edit_events and returns them as REDACTED examples the model can imitate
 * for structure/quality — never for facts.
 *
 * Privacy: exemplars are other users' CVs, so we strip direct identifiers
 * (name, email, phone) and employer names before they ever enter a prompt. The
 * prompt also forbids copying any fact from them. This is a pragmatic MVP guard;
 * before scaling, add an explicit "use my CV to help others" consent flag and
 * only retrieve from opted-in rows.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CVData, Language } from "@/types/cv";
import { logger } from "@/lib/log";

const MAX_EXEMPLARS = 2;
const CANDIDATE_POOL = 24;

/** Keep structure/quality signal; drop direct identifiers + employer names. */
function redact(cv: CVData): unknown {
  return {
    // Keep location/nationality (format signal, low sensitivity); drop name/contact.
    personal: {
      nationality: cv.personal?.nationality ?? "",
      city: cv.personal?.city ?? "",
      country: cv.personal?.country ?? "",
    },
    objective: cv.objective ?? "",
    experience: (cv.experience ?? []).map((e) => ({
      role: e.role ?? "",
      duration: e.duration ?? "",
      description: e.description ?? "", // the bullet style is the valuable part
    })),
    education: cv.education ?? [],
    certificates: cv.certificates ?? [],
    skills: cv.skills ?? [],
    languages: cv.languages ?? [],
    hobbies: cv.hobbies ?? [],
    achievements: cv.achievements ?? [],
  };
}

function roleMatches(storedRole: string | null, hint: string): boolean {
  if (!storedRole || !hint) return false;
  const role = storedRole.toLowerCase().trim();
  const h = hint.toLowerCase();
  if (!role) return false;
  if (h.includes(role)) return true;
  // Any meaningful word of the stored role appearing in the candidate's answer.
  return role.split(/\s+/).some((w) => w.length > 3 && h.includes(w));
}

interface EventRow {
  role: string | null;
  final_cv: CVData;
  edited: boolean;
  updated_at: string;
}

/**
 * Returns up to MAX_EXEMPLARS redacted CV JSON strings for the given output
 * language, preferring role-matched and human-edited CVs. Best-effort — returns
 * [] on any failure so generation proceeds exactly as before.
 */
export async function fetchExemplars(
  supabase: SupabaseClient,
  outputLanguage: Language,
  roleHint: string,
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("cv_edit_events")
      .select("role, final_cv, edited, updated_at")
      // Human-edited finals first (strongest signal), then most recent.
      .eq("output_language", outputLanguage)
      .order("edited", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(CANDIDATE_POOL);
    if (error || !data || data.length === 0) return [];

    const rows = data as EventRow[];
    // Rank: role match first, then the DB order (edited desc, recent desc).
    const ranked = rows
      .map((r, i) => ({ r, i, match: roleMatches(r.role, roleHint) }))
      .sort((a, b) => Number(b.match) - Number(a.match) || a.i - b.i)
      .slice(0, MAX_EXEMPLARS);

    return ranked
      .filter((x) => x.r.final_cv)
      .map((x) => JSON.stringify(redact(x.r.final_cv)));
  } catch (err) {
    logger.warn("fetchExemplars failed; generating without few-shot", { err });
    return [];
  }
}
