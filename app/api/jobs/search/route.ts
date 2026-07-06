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
  const query = body.query?.trim() || derived.query;
  const location = body.location?.trim() ?? derived.location;
  if (!query) {
    return badRequest("Add work experience to your CV, or type a role to search for.");
  }

  // Target the right job market — without a country code JSearch defaults to
  // the US and returns nothing for e.g. German/Pakistani/Gulf searches.
  const country = countryCodeFrom(location, cvData.personal.country);

  let listings;
  try {
    listings = await searchJobs({
      query,
      location,
      country,
      // One page (~10 results) is plenty and roughly halves upstream latency —
      // JSearch time scales with num_pages and was timing out at 2 from Railway.
      numPages: 1,
      remoteOnly: body.remoteOnly,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Job search failed";
    log.warn("job provider failed", { err, query });
    // 502 — upstream provider issue (or missing key), not the client's fault.
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const jobs = await rankJobs(cvData, listings);

  await logEvent(supabase, user.id, "job_search", {
    cvId: cv.id,
    query,
    location,
    country,
    count: jobs.length,
  });
  log.info("job search", {
    userId: user.id,
    cvId: cv.id,
    country,
    count: jobs.length,
  });

  return ok({ jobs, query, location });
});
