import { migrateCvData } from "@/lib/cv/migrate";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, conflict, notFound, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { logEvent } from "@/lib/analytics-server";
import { searchJobs } from "@/lib/jobs/search";
import { countryCodeFrom } from "@/lib/jobs/geo";
import { queryFromCv, rankJobs } from "@/lib/jobs/match";
import { NextResponse } from "next/server";
import type { CVRecord } from "@/types/cv";
import type { JobListing } from "@/types/jobs";

/** How the results were found, when we had to broaden the original search. */
type Scope = "exact" | "country" | "anywhere";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  cvId: string;
  query?: string;
  location?: string;
  remoteOnly?: boolean;
}

export const POST = handle("jobs-search", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`jobsearch:${user.id}`, LIMITS.jobSearch);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many searches. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
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
  const cvData = migrateCvData(cv.cv_data);

  const derived = queryFromCv(cvData);
  const reqQuery = body.query?.trim() || derived.query;
  const reqLocation = body.location?.trim() ?? derived.location;
  if (!reqQuery) {
    return badRequest("Add work experience to your CV, or type a role to search for.");
  }

  const cvCountry = cvData.personal.country?.trim() || "";

  // Relaxation ladder: a specific "role in city" that returns nothing should
  // never dead-end. We broaden the LOCATION step by step — city → country →
  // anywhere — and take the first attempt that returns results, then rank them
  // against the CV so the best fits float up. Capped at 3 attempts so latency
  // stays bounded (only the empty case ever loops).
  const ladder: { query: string; location: string; scope: Scope }[] = [
    { query: reqQuery, location: reqLocation, scope: "exact" },
  ];
  if (reqLocation && cvCountry && reqLocation.toLowerCase() !== cvCountry.toLowerCase()) {
    ladder.push({ query: reqQuery, location: cvCountry, scope: "country" });
  }
  if (reqLocation) {
    ladder.push({ query: reqQuery, location: "", scope: "anywhere" });
  }

  let listings: JobListing[] = [];
  let used = ladder[0];
  for (let i = 0; i < ladder.length; i++) {
    const attempt = ladder[i];
    used = attempt;
    // Target the right job market — without a country code JSearch defaults to
    // the US and returns nothing for e.g. German/Pakistani/Gulf searches.
    const country = countryCodeFrom(attempt.location, cvData.personal.country);
    try {
      listings = await searchJobs({
        query: attempt.query,
        location: attempt.location,
        country,
        // One page (~10 results) is plenty and roughly halves upstream latency.
        numPages: 1,
        remoteOnly: body.remoteOnly,
      });
    } catch (err) {
      // A throw on the FIRST (exact) attempt is a real provider error → surface
      // it. On broadening attempts we treat a throw as empty and keep going.
      if (i === 0) {
        const message = err instanceof Error ? err.message : "Job search failed";
        log.warn("job provider failed", { err, query: attempt.query });
        return NextResponse.json({ error: message }, { status: 502 });
      }
      listings = [];
    }
    if (listings.length > 0) break;
  }

  const jobs = await rankJobs(cvData, listings);
  const relaxed = used.scope !== "exact" && jobs.length > 0;

  await logEvent(supabase, user.id, "job_search", {
    cvId: cv.id,
    query: used.query,
    location: used.location,
    scope: used.scope,
    count: jobs.length,
  });
  log.info("job search", {
    userId: user.id,
    cvId: cv.id,
    scope: used.scope,
    count: jobs.length,
  });

  return ok({
    jobs,
    query: used.query,
    location: used.location,
    relaxation: relaxed
      ? { scope: used.scope, requestedQuery: reqQuery, requestedLocation: reqLocation }
      : null,
  });
});
