/**
 * Unlock a JD Match rewrite and save it as a NEW tailored CV.
 *
 * Premium action: spends one premium-CV credit. The user's master CV is never
 * touched — applying produces a separate CV titled after the role, so one
 * master can spawn a tailored version per application. That copy deliberately
 * does NOT call `increment_cvs_created`: the premium credit already paid for
 * it, and charging the lifetime free-CV allowance as well would be charging
 * twice for the same action.
 *
 * Idempotent: re-applying the same match returns the CV that was already
 * created rather than charging again.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import {
  badRequest,
  notFound,
  ok,
  paymentRequired,
  unauthorized,
} from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { migrateCvData } from "@/lib/cv/migrate";
import { isCompAccount } from "@/lib/premium/access";
import { createAdminClient } from "@/lib/supabase/server";
import { applyDraft } from "@/lib/jobs/jd-match";
import { CLAUDE_MATCH_MODEL } from "@/lib/ai/models";
import { logEvent } from "@/lib/analytics-server";
import { NextResponse } from "next/server";
import type { JdDraft } from "@/types/jd-match";

export const runtime = "nodejs";
export const maxDuration = 30;

interface Body {
  matchId?: string;
}

/** "Ana's CV — Senior Analyst @ Acme", bounded so it fits the dashboard card. */
function copyTitle(base: string, role: string, company: string): string {
  const target = [role, company && `@ ${company}`].filter(Boolean).join(" ");
  const title = target ? `${base} — ${target}` : `${base} (tailored)`;
  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}

export const POST = handle("jobs-jd-match-apply", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`jdapply:${user.id}`, LIMITS.jdApply);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.matchId) return badRequest("matchId required");

  // `draft` is not readable by the browser's client (migration 028), so this
  // read goes through the service-role client — scoped to the caller by the
  // explicit user_id filter, which is doing the work RLS would otherwise do.
  const admin = createAdminClient();
  const { data: match } = await admin
    .from("jd_matches")
    .select("id, cv_id, tailored_cv_id, job_title, company, draft, analysis")
    .eq("id", body.matchId)
    .eq("user_id", user.id)
    .single();
  if (!match) return notFound("Analysis not found");

  const draft = (match.draft ?? {}) as JdDraft;
  if (!draft.tailoredSummary && (draft.tailoredExperience ?? []).length === 0) {
    return badRequest("This analysis has no rewrite to apply.");
  }

  // Already paid for — hand back the same CV instead of charging twice.
  if (match.tailored_cv_id) {
    return ok({ cvId: match.tailored_cv_id, draft, alreadyApplied: true });
  }

  if (!match.cv_id) {
    return notFound("The CV this analysis was run against no longer exists.");
  }

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("cv_data, title, template, language, transcript")
    .eq("id", match.cv_id)
    .eq("user_id", user.id)
    .single();
  if (!cvRow?.cv_data) return notFound("CV not found");

  const original = migrateCvData(cvRow.cv_data);
  const tailored = applyDraft(original, draft);
  // The rewrite never carries the opt-in photo — preserve the user's choice.
  tailored.personal.photo_url = original.personal.photo_url ?? "";

  const comped = await isCompAccount(supabase);

  // Cheap pre-check so the common "no credits" case never leaves an orphan CV
  // behind. The authoritative charge is the RPC below.
  if (!comped) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("premium_cv_credits")
      .eq("id", user.id)
      .single();
    if ((prof?.premium_cv_credits ?? 0) < 1) return paymentRequired("Premium required");
  }

  const baseTitle = (cvRow.title as string) || original.personal.full_name || "My CV";
  const { data: created, error: insErr } = await supabase
    .from("cvs")
    .insert({
      user_id: user.id,
      status: "ready",
      title: copyTitle(baseTitle, match.job_title as string, match.company as string),
      cv_data: tailored,
      // Snapshot for the edit-diff learning loop: for a tailored copy the AI's
      // "original output" is the tailored version, not the master CV.
      generated_cv_data: tailored,
      generated_by: CLAUDE_MATCH_MODEL,
      template: cvRow.template ?? "modern",
      language: cvRow.language ?? "en",
      transcript: cvRow.transcript ?? null,
    })
    .select("id")
    .single();
  if (insErr) throw insErr;
  const newCvId = created!.id as string;

  // Charge against the NEW CV so the copy is the one that comes out premium —
  // the user paid for this version, and premium templates should work on it.
  if (comped) {
    // `premium_unlocked` is server-only since migration 023; the user_id filter
    // is the scoping guard now that RLS is bypassed.
    await admin
      .from("cvs")
      .update({ premium_unlocked: true })
      .eq("id", newCvId)
      .eq("user_id", user.id);
  } else {
    const { data: unlocked, error: rpcErr } = await supabase.rpc(
      "consume_premium_cv_credit",
      { p_cv: newCvId },
    );
    if (rpcErr || !unlocked) {
      // Lost the race for the last credit (or the RPC failed) — roll the copy
      // back so an unpaid CV can never linger in the user's dashboard.
      await supabase.from("cvs").delete().eq("id", newCvId).eq("user_id", user.id);
      if (rpcErr) throw rpcErr;
      return paymentRequired("Premium required");
    }
  }

  const { error: markErr } = await admin
    .from("jd_matches")
    .update({ unlocked: true, tailored_cv_id: newCvId })
    .eq("id", match.id)
    .eq("user_id", user.id);
  if (markErr) log.warn("jd match unlock flag not persisted", { err: markErr });

  await logEvent(supabase, user.id, "jd_match_applied", {
    matchId: match.id,
    sourceCvId: match.cv_id,
    cvId: newCvId,
    comped,
  });
  log.info("jd match applied", { userId: user.id, matchId: match.id, cvId: newCvId });

  return ok({ cvId: newCvId, draft, alreadyApplied: false });
});
