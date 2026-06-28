import { generateCV, outputLanguageFor } from "@/lib/claude";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { FREE_CV_LIMIT } from "@/lib/premium";
import { NextResponse } from "next/server";
import type { Language, QAPair } from "@/types/cv";
import { OUTPUT_LANGUAGES } from "@/types/cv";

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
  // free). allowance = FREE_CV_LIMIT + purchased cv_credits. Checked before
  // the (paid) model call so we don't waste tokens when over the limit.
  if (!body.cvId) {
    const [{ count }, { data: prof }] = await Promise.all([
      supabase
        .from("cvs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase.from("profiles").select("cv_credits").eq("id", user.id).single(),
    ]);
    const allowance = FREE_CV_LIMIT + (prof?.cv_credits ?? 0);
    if ((count ?? 0) >= allowance) {
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

  const cvData = await generateCV(body.qaPairs, body.language, cvLanguage);
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
        title,
        language: cvLanguage,
      })
      .select("id")
      .single();
    if (error) throw error;
    cvId = data!.id as string;
  } else {
    const { error } = await supabase
      .from("cvs")
      .update({
        cv_data: cvData,
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

  log.info("cv generated", { cvId, userId: user.id });
  return ok({ cvId, cvData });
});
