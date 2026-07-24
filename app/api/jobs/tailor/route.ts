/**
 * Tailored-rewrite delivery. Premium action: spends one premium-CV credit
 * (idempotent — an already-premium CV is free) to rewrite the CV against a
 * specific job, then saves it. Returns 402 when the user has no credit, so the
 * jobs page can open the upsell.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import {
  badRequest,
  notFound,
  ok,
  paymentRequired,
  serverError,
  unauthorized,
} from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { migrateCvData } from "@/lib/cv/migrate";
import { isCompAccount } from "@/lib/premium/access";
import { createAdminClient } from "@/lib/supabase/server";
import { tailorCV } from "@/lib/jobs/tailor";
import { logEvent } from "@/lib/analytics-server";
import { NextResponse } from "next/server";
import type { Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  cvId?: string;
  jobTitle?: string;
  jobDescription?: string;
}

export const POST = handle("jobs-tailor", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`jobtailor:${user.id}`, LIMITS.jobTailor);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.cvId || !body.jobDescription) {
    return badRequest("cvId and jobDescription required");
  }

  // Verify the CV exists and belongs to the caller BEFORE charging, so an
  // invalid cvId can never burn a credit.
  const { data: cvRow } = await supabase
    .from("cvs")
    .select("cv_data, language")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!cvRow?.cv_data) return notFound("CV not found");

  // Gate: spend a premium-CV credit (idempotent — an already-premium CV is free,
  // and also enables premium templates). Comped reviewers skip the charge but
  // still get the CV genuinely unlocked. Returns false → no credit → upsell.
  if (await isCompAccount(supabase)) {
    // Service-role write: `premium_unlocked` is server-only since migration 023.
    // `.eq("user_id", user.id)` is the scoping guard now that RLS is bypassed.
    await createAdminClient()
      .from("cvs")
      .update({ premium_unlocked: true })
      .eq("id", body.cvId)
      .eq("user_id", user.id);
  } else {
    const { data: unlocked, error: rpcErr } = await supabase.rpc("consume_premium_cv_credit", {
      p_cv: body.cvId,
    });
    if (rpcErr) throw rpcErr;
    if (!unlocked) return paymentRequired("Premium required");
  }

  const cv = migrateCvData(cvRow.cv_data);
  const lang = (cvRow.language as Language) ?? "en";

  let tailored;
  try {
    tailored = await tailorCV(cv, body.jobTitle ?? "", body.jobDescription, lang);
  } catch (err) {
    log.warn("cv tailor failed", { err });
    return serverError("Couldn't tailor the CV — please try again.");
  }

  // The AI rewrite doesn't carry the opt-in photo — preserve the user's choice.
  tailored.personal.photo_url = cv.personal.photo_url ?? "";

  const { error: upErr } = await supabase
    .from("cvs")
    .update({ cv_data: tailored, updated_at: new Date().toISOString() })
    .eq("id", body.cvId)
    .eq("user_id", user.id);
  if (upErr) throw upErr;

  await logEvent(supabase, user.id, "cv_tailored", { cvId: body.cvId });
  log.info("cv tailored", { cvId: body.cvId, userId: user.id });
  return ok({ cvId: body.cvId });
});
