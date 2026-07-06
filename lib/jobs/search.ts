/**
 * Job-search orchestrator: try providers in order, fall through on failure or
 * empty results.
 *
 * Order: **JSearch first** (broadest global coverage incl. Pakistan/Gulf that
 * Adzuna lacks), then **Adzuna** as backup — which (a) covers markets JSearch
 * is thin in (notably Australia) and (b) rescues the search when JSearch times
 * out or errors from Railway's IP.
 *
 * Rules:
 *  - First provider that returns ≥1 listing wins.
 *  - A provider that throws (timeout, auth, HTTP error) is logged and skipped.
 *  - If every provider returns empty, return [] (caller shows "no jobs found").
 *  - If every provider throws, re-throw the last error so the user sees a real
 *    message instead of a silent empty list.
 */

import type { JobProvider, JobSearchParams } from "./provider";
import type { JobListing } from "@/types/jobs";
import { jsearchProvider } from "./jsearch";
import { adzunaProvider } from "./adzuna";
import { logger } from "@/lib/log";

/** Providers in priority order. Only configured ones actually run (unconfigured
 * providers throw "not configured", which we treat as skip). */
const PROVIDERS: JobProvider[] = [jsearchProvider, adzunaProvider];

export async function searchJobs(params: JobSearchParams): Promise<JobListing[]> {
  let lastError: unknown = null;
  let anyRan = false;

  for (const provider of PROVIDERS) {
    try {
      const jobs = await provider.search(params);
      anyRan = true;
      if (jobs.length > 0) {
        logger.info("job search hit", { provider: provider.name, count: jobs.length });
        return jobs;
      }
      logger.info("job search empty; trying next provider", { provider: provider.name });
    } catch (err) {
      lastError = err;
      logger.warn("job provider failed; trying next", { provider: provider.name, err });
    }
  }

  // Every provider was empty → genuinely no results.
  if (anyRan) return [];
  // Nothing ran successfully (all threw). Surface the last real error.
  throw lastError ?? new Error("Job search is unavailable right now.");
}
