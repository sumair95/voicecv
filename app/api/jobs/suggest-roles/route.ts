/**
 * Role suggestions for a CV — used by /jobs to offer one-tap searches. Best-
 * effort: on rate-limit or error it returns an empty list so the page degrades
 * to the plain search box.
 */

import { migrateCvData } from "@/lib/cv/migrate";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { suggestRoles } from "@/lib/jobs/suggest";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export const POST = handle("jobs-suggest-roles", async ({ req }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`jobsuggest:${user.id}`, LIMITS.jobImprove);
  if (!rate.ok) return NextResponse.json({ roles: [] }); // silent degrade

  const body = (await req.json()) as { cvId?: string };
  if (!body.cvId) return badRequest("cvId required");

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("cv_data")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!cvRow?.cv_data) return notFound("CV not found");

  const roles = await suggestRoles(migrateCvData(cvRow.cv_data));
  return ok({ roles });
});
