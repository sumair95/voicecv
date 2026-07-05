/**
 * Job-provider abstraction. Today the only implementation is JSearch
 * (`./jsearch`), but every consumer depends on this interface — not JSearch
 * directly — so a second provider (Adzuna, LinkedIn, …) can be dropped in
 * without touching the routes or UI.
 */

import type { JobListing } from "@/types/jobs";

export interface JobSearchParams {
  /** Role / keywords, e.g. "senior electrician". */
  query: string;
  /** Free-text location, e.g. "Karachi, Pakistan". */
  location?: string;
  page?: number;
  /** How many result pages to pull (JSearch returns ~10 per page). */
  numPages?: number;
  remoteOnly?: boolean;
}

export interface JobProvider {
  readonly name: string;
  search(params: JobSearchParams): Promise<JobListing[]>;
}
