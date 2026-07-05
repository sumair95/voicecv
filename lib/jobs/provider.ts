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
  /** ISO-3166 alpha-2 country code (e.g. "de", "pk"). Targets the right market. */
  country?: string;
  page?: number;
  /** How many result pages to pull (JSearch returns ~10 per page). */
  numPages?: number;
  /** JSearch date filter: all | today | 3days | week | month. Defaults to "all". */
  datePosted?: "all" | "today" | "3days" | "week" | "month";
  remoteOnly?: boolean;
}

export interface JobProvider {
  readonly name: string;
  search(params: JobSearchParams): Promise<JobListing[]>;
}
