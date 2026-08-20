/**
 * JD Match — score a CV against a job description the user brought themselves.
 *
 * Free and rate-limited: the score, the per-axis breakdown, the missing
 * keywords and the ATS problems all come back immediately, because a candidate
 * who can see exactly why they scored 41 is the one who converts. The rewrite
 * that fixes it is produced in the same call but held server-side (see
 * migration 028) — the client gets one teaser sentence and unlocks the rest
 * through /api/jobs/jd-match/apply, which spends a premium-CV credit.
 *
 * Producing the rewrite up-front costs nothing extra (it is one model call
 * either way) and means unlocking is instant rather than another 30 seconds of
 * waiting after payment.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { migrateCvData } from "@/lib/cv/migrate";
import { createAdminClient } from "@/lib/supabase/server";
import { analyzeJdMatch, MAX_JD_CHARS, summaryTeaser } from "@/lib/jobs/jd-match";
import { logEvent } from "@/lib/analytics-server";
import { NextResponse } from "next/server";
import type { Language } from "@/types/cv";
import type { JdMatchResponse } from "@/types/jd-match";

export const runtime = "nodejs";
// Opus with adaptive thinking on a long posting can run well past the default.
export const maxDuration = 120;

/** Short enough that a stray paste isn't a job ad; long enough for a real one. */
const MIN_JD_CHARS = 120;

interface Body {
  cvId?: string;
  jobTitle?: string;
  jobDescription?: string;
}

export const POST = handle("jobs-jd-match", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`jdmatch:${user.id}`, LIMITS.jdMatch);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many analyses. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = (await req.json()) as Body;
  const jd = (body.jobDescription ?? "").trim();
  if (!body.cvId) return badRequest("cvId required");
  if (jd.length < MIN_JD_CHARS) {
    return badRequest("Paste the full job description — that looks too short to score.");
  }

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("cv_data, language")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!cvRow?.cv_data) return notFound("CV not found");

  const cv = migrateCvData(cvRow.cv_data);
  if (cv.experience.length === 0) {
    return badRequest(
      "This CV has no work experience yet, so there's nothing to tailor to the role.",
    );
  }

  const lang = (cvRow.language as Language) ?? "en";

  let result;
  try {
    result = await analyzeJdMatch(cv, jd, body.jobTitle ?? "", lang);
  } catch (err) {
    log.warn("jd match analysis failed", { err, cvId: body.cvId });
    return serverError("Couldn't analyse that job description — please try again.");
  }

  const { draft, ...analysis } = result;

  // Service-role write: `draft` and `unlocked` are entitlement-bearing columns
  // the browser must never set (migration 028 revokes insert/update there).
  const admin = createAdminClient();
  const { data: matchRow, error: insErr } = await admin
    .from("jd_matches")
    .insert({
      user_id: user.id,
      cv_id: body.cvId,
      job_title: analysis.detectedRole || (body.jobTitle ?? "").slice(0, 120),
      company: analysis.detectedCompany,
      jd_text: jd.slice(0, MAX_JD_CHARS),
      overall_score: analysis.overallScore,
      projected_score: analysis.projectedScore,
      analysis,
      draft,
      unlocked: false,
    })
    .select("id")
    .single();
  // Deliberately non-fatal. The analysis already cost a 40-second Opus call, so
  // a storage problem (most likely: migration 028 not applied yet) must not
  // throw that away. The user still gets their score and gaps; an empty matchId
  // tells the client the rewrite can't be unlocked for this run.
  if (insErr) log.error("jd match not persisted — unlock unavailable", { err: insErr });

  await logEvent(supabase, user.id, "jd_match_analysed", {
    cvId: body.cvId,
    score: analysis.overallScore,
    projected: analysis.projectedScore,
    verdict: analysis.verdict,
  });
  log.info("jd match analysed", {
    userId: user.id,
    cvId: body.cvId,
    score: analysis.overallScore,
  });

  // How many rewritten blocks are waiting: the summary, the headline, and one
  // per rewritten role. Drives the "unlock N improvements" label.
  const lockedCount =
    (draft.tailoredSummary ? 1 : 0) +
    (draft.tailoredJobTitle ? 1 : 0) +
    draft.tailoredExperience.length;

  const matchId = (matchRow?.id as string | undefined) ?? "";
  const payload: JdMatchResponse = {
    matchId,
    analysis,
    // No stored row means nothing to unlock — don't dangle a paywall the apply
    // route couldn't honour.
    summaryTeaser: matchId ? summaryTeaser(draft) : "",
    lockedCount: matchId ? lockedCount : 0,
    unlocked: false,
  };
  return ok(payload);
});
