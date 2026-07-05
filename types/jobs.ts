/** AI Job Match — shared types (client-safe, type-only). */

export type JobStatus = "saved" | "applied" | "interview" | "offer" | "rejected";

export const JOB_STATUSES: JobStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

/**
 * A normalized job listing returned by any provider (currently JSearch).
 * `score`/`reason` are populated after the AI ranking pass.
 */
export interface JobListing {
  /** Provider-scoped unique id (e.g. JSearch job_id). */
  id: string;
  title: string;
  company: string;
  location: string;
  /** URL to apply on the employer / board site. */
  applyUrl: string;
  logo: string | null;
  salaryText: string | null;
  description: string;
  employmentType: string | null;
  remote: boolean;
  /** ISO datetime the job was posted, if known. */
  postedAt: string | null;
  source: string;
  /** AI match score 0-100. */
  score?: number;
  /** One-line reason the CV matches this job. */
  reason?: string;
}

/** A persisted application/tracker row (see migration 015). */
export interface JobApplication {
  id: string;
  user_id: string;
  cv_id: string | null;
  external_job_id: string;
  source: string | null;
  title: string;
  company: string;
  location: string | null;
  apply_url: string | null;
  logo: string | null;
  salary_text: string | null;
  match_score: number | null;
  match_reason: string | null;
  status: JobStatus;
  notes: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
}
