/**
 * Edit-diff logging — records the (AI-generated -> human-approved) CV pair so
 * future generations can few-shot from the best real CVs for a similar role.
 *
 * Called (fire-and-forget) by the CV editor whenever it persists a change.
 * Upserts one row per CV keyed on cv_id, so it always holds the LATEST final
 * version, not every keystroke. No-ops cleanly for CVs created before migration
 * 016 (no generated_cv_data snapshot to diff against).
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, ok, unauthorized } from "@/lib/api/respond";
import type { CVData } from "@/types/cv";

export const runtime = "nodejs";

interface Body {
  cvId: string;
}

export const POST = handle("cv-log-edit", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const body = (await req.json()) as Body;
  if (!body.cvId) return badRequest("cvId required");

  const { data: row } = await supabase
    .from("cvs")
    .select("id, cv_data, generated_cv_data, generated_by, language")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!row) return notFound("CV not found");

  const generated = row.generated_cv_data as CVData | null;
  const final = row.cv_data as CVData | null;
  // Nothing to learn from until we have both the AI original and a final.
  if (!generated || !final) return ok({ logged: false });

  const edited = JSON.stringify(generated) !== JSON.stringify(final);
  const role = final.experience?.[0]?.role?.trim() || null;

  const { error } = await supabase.from("cv_edit_events").upsert(
    {
      cv_id: row.id,
      user_id: user.id,
      role,
      output_language: row.language,
      model: row.generated_by,
      generated_cv: generated,
      final_cv: final,
      edited,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "cv_id" },
  );
  if (error) {
    // Learning telemetry must never break the editor — log and move on.
    log.warn("cv edit-log upsert failed", { err: error, cvId: row.id });
    return ok({ logged: false });
  }

  return ok({ logged: true, edited });
});
