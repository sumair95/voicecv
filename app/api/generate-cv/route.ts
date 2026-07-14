import { outputLanguageFor } from "@/lib/claude";
import {
  generatePrimaryCV,
  hasChallengers,
  runChallengers,
  type GeneratedCV,
} from "@/lib/cv-models/generate";
import { fetchExemplars } from "@/lib/cv-models/exemplars";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { FREE_CV_LIMIT } from "@/lib/premium";
import { logEvent } from "@/lib/analytics-server";
import { logger } from "@/lib/log";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language, QAPair } from "@/types/cv";
import { OUTPUT_LANGUAGES } from "@/types/cv";

/**
 * Background multi-model competition. Runs AFTER the primary CV is returned, so
 * the user never waits. Logs every model's blind score and, if a challenger
 * beats Claude, swaps the stored CV to the winner — but only when the user
 * hasn't edited it yet (never clobbers edits).
 */
async function runCompetitionInBackground(
  supabase: SupabaseClient,
  userId: string,
  cvId: string,
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language,
  exemplars: string[],
  primary: GeneratedCV,
): Promise<void> {
  try {
    const { scores, winner } = await runChallengers(
      qaPairs,
      language,
      outputLanguage,
      exemplars,
      primary,
    );

    if (scores.length > 0) {
      await supabase.from("cv_model_scores").insert(
        scores.map((s) => ({
          cv_id: cvId,
          user_id: userId,
          model: s.model,
          score: s.score,
          won: s.won,
        })),
      );
    }

    if (winner) {
      // Edit-safe swap: only replace cv_data if it's still exactly the primary
      // output (i.e. the user hasn't started editing in the few seconds since).
      const { data: cur } = await supabase
        .from("cvs")
        .select("cv_data")
        .eq("id", cvId)
        .eq("user_id", userId)
        .single();
      if (cur && JSON.stringify(cur.cv_data) === JSON.stringify(primary.cvData)) {
        await supabase
          .from("cvs")
          .update({
            cv_data: winner.cvData,
            generated_cv_data: winner.cvData,
            generated_by: winner.model,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cvId)
          .eq("user_id", userId);
        logger.info("multi-model background swap", { cvId, winner: winner.model });
      } else {
        logger.info("multi-model swap skipped (cv already changed)", { cvId });
      }
    }
  } catch (err) {
    logger.warn("background competition failed", { err, cvId });
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;

interface RequestBody {
  cvId?: string;
  qaPairs: QAPair[];
  language: Language;
  /** Optional CV output language chosen by the user; defaults per input. */
  outputLanguage?: Language;
}

export const POST = handle("generate-cv", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`gen:${user.id}`, LIMITS.generateCv);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many CV generations. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = (await req.json()) as RequestBody;
  if (!Array.isArray(body.qaPairs) || body.qaPairs.length === 0) {
    return badRequest("qaPairs required");
  }

  // Free-CV limit — only for brand-new CVs (regenerating an existing one is
  // free). Lifetime: cvs_created counts every CV ever made (deleting one does
  // NOT free a slot). allowance = FREE_CV_LIMIT + purchased cv_credits. Checked
  // before the (paid) model call so we don't waste tokens when over the limit.
  if (!body.cvId) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("cvs_created, cv_credits")
      .eq("id", user.id)
      .single();
    const allowance = FREE_CV_LIMIT + (prof?.cv_credits ?? 0);
    if ((prof?.cvs_created ?? 0) >= allowance) {
      return paymentRequired("Free CV limit reached");
    }
  }

  const transcript = body.qaPairs
    .map((qa) => `${qa.question}\n${qa.answer}`)
    .join("\n\n");

  // Generate first; insert/update the cvs row only after Claude succeeds.
  // Avoids zombie status='processing' rows when the model call fails.
  log.info("generating cv", {
    userId: user.id,
    cvId: body.cvId ?? null,
    questions: body.qaPairs.length,
  });
  // Language the CV text is written in: honour the user's explicit choice if
  // it's a supported output language, otherwise fall back to the per-input
  // default (Italian input → Italian, everything else → English).
  const cvLanguage =
    body.outputLanguage && OUTPUT_LANGUAGES.includes(body.outputLanguage)
      ? body.outputLanguage
      : outputLanguageFor(body.language);

  // Retrieval-augmented few-shot: pull redacted, human-approved CVs for a
  // similar role + language to guide structure/quality (never facts). Best-
  // effort — an empty result means generation behaves exactly as before.
  const roleHint =
    body.qaPairs.find((qa) => qa.field_key === "recent_job")?.answer ?? "";
  const exemplars = await fetchExemplars(supabase, cvLanguage, roleHint);
  if (exemplars.length > 0) {
    log.info("few-shot exemplars used", { count: exemplars.length });
  }

  // Generate the PRIMARY CV (Claude) and return it immediately. When
  // multi-model is enabled, challenger models + the blind judge run in the
  // background after we respond (see below) — the user never waits for them.
  const primary = await generatePrimaryCV(
    body.qaPairs,
    body.language,
    cvLanguage,
    exemplars,
  );
  const cvData = primary.cvData;
  const primaryModel = primary.model;
  const title = cvData.personal?.full_name || "My CV";

  let cvId = body.cvId;
  if (!cvId) {
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id: user.id,
        status: "ready",
        transcript,
        cv_data: cvData,
        // Immutable snapshot of the AI's original output for edit-diff learning
        // (cv_data gets overwritten by edits; this never does).
        generated_cv_data: cvData,
        generated_by: primaryModel,
        title,
        language: cvLanguage,
      })
      .select("id")
      .single();
    if (error) throw error;
    cvId = data!.id as string;
    // Count this CV against the lifetime free allowance (best-effort).
    await supabase.rpc("increment_cvs_created");
  } else {
    const { error } = await supabase
      .from("cvs")
      .update({
        cv_data: cvData,
        // Regenerating is a fresh AI output — reset the original snapshot too.
        generated_cv_data: cvData,
        generated_by: primaryModel,
        transcript,
        title,
        status: "ready",
        language: cvLanguage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", user.id);
    if (error) throw error;
  }

  // Fire the multi-model competition in the BACKGROUND (Railway keeps the Node
  // process alive) — challengers + judge run after we respond; the winner is
  // swapped in only if the user hasn't started editing. Not awaited.
  if (hasChallengers() && cvId) {
    void runCompetitionInBackground(
      supabase,
      user.id,
      cvId,
      body.qaPairs,
      body.language,
      cvLanguage,
      exemplars,
      primary,
    );
  }

  await logEvent(supabase, user.id, "cv_generated", {
    isNew: !body.cvId,
    language: cvLanguage,
    model: primaryModel,
  });

  log.info("cv generated", { cvId, userId: user.id });
  return ok({ cvId, cvData });
});
