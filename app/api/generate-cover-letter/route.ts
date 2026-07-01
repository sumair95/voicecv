import { generateCoverLetter } from "@/lib/cover-letter";
import { migrateCvData } from "@/lib/cv/migrate";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import {
  badRequest,
  conflict,
  notFound,
  ok,
  unauthorized,
} from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics-server";
import { NextResponse } from "next/server";
import type { CVRecord, Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  cvId: string;
  targetRole?: string;
  company?: string;
}

export const POST = handle("generate-cover-letter", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`cover:${user.id}`, LIMITS.generateCv);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.cvId) return badRequest("cvId required");

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!cvRow) return notFound("CV not found");

  const cv = cvRow as CVRecord;
  if (!cv.cv_data) return conflict("CV is not ready");

  // Generation is FREE (view the full letter). The paywall is on DOWNLOAD —
  // see /api/export-cover-letter-pdf, which spends a cover_letter_credit.
  const language: Language = cv.language ?? "en";
  const letter = await generateCoverLetter(migrateCvData(cv.cv_data), {
    targetRole: body.targetRole?.trim() || undefined,
    company: body.company?.trim() || undefined,
    language,
  });

  const { error } = await supabase
    .from("cvs")
    .update({ cover_letter: letter, updated_at: new Date().toISOString() })
    .eq("id", cv.id)
    .eq("user_id", user.id);
  if (error) throw error;

  await logEvent(supabase, user.id, "cover_letter_generated", { cvId: cv.id });
  log.info("cover letter generated", { cvId: cv.id, userId: user.id });
  return ok({ coverLetter: letter });
});
