/**
 * JSearch provider (RapidAPI). Aggregates Google for Jobs across LinkedIn,
 * Indeed, Glassdoor, etc. Docs: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 *
 * Requires `RAPIDAPI_KEY` in the environment. The key is read lazily so the app
 * boots (and every other feature works) even before the key is added — job
 * search just returns a clear "not configured" error until then.
 */

import type { JobProvider, JobSearchParams } from "./provider";
import type { JobListing } from "@/types/jobs";
import { withRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/log";

const HOST = "jsearch.p.rapidapi.com";

/** Raw JSearch job shape (only the fields we consume). */
interface JSearchJob {
  job_id?: string;
  job_title?: string;
  employer_name?: string;
  employer_logo?: string | null;
  job_apply_link?: string;
  job_location?: string | null;
  job_city?: string | null;
  job_state?: string | null;
  job_country?: string | null;
  job_is_remote?: boolean;
  job_employment_type?: string | null;
  job_description?: string;
  job_posted_at_datetime_utc?: string | null;
  // /search-v2 provides a ready-made salary string; older fields kept as fallback.
  job_salary_string?: string | null;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_period?: string | null;
}

function salaryText(j: JSearchJob): string | null {
  if (j.job_salary_string) return j.job_salary_string;
  const { job_min_salary: min, job_max_salary: max } = j;
  if (!min && !max) return null;
  const period = j.job_salary_period ? `/${j.job_salary_period.toLowerCase()}` : "";
  const fmt = (n: number) => n.toLocaleString();
  const range =
    min && max ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max) as number);
  return `${range}${period}`.trim();
}

/** Map a RapidAPI/JSearch HTTP failure to an actionable, user-facing message. */
function rapidApiMessage(status: number, body: string): string {
  const notSubscribed =
    status === 403 ||
    // A valid key whose app isn't subscribed to *this* API gets a 404
    // "Endpoint ... does not exist" from the gateway.
    (status === 404 && /does not exist|not subscribed/i.test(body));
  if (notSubscribed) {
    return "Job search key isn't subscribed to JSearch. On RapidAPI, subscribe to 'JSearch' (Basic/free) and copy that app's X-RapidAPI-Key into RAPIDAPI_KEY.";
  }
  if (status === 401) {
    return "Job search key was rejected (invalid RAPIDAPI_KEY).";
  }
  if (status === 429) {
    return "Job search rate limit reached on RapidAPI. Try again shortly or upgrade the JSearch plan.";
  }
  return `Job search provider error (HTTP ${status}).`;
}

function normalize(j: JSearchJob): JobListing | null {
  if (!j.job_id || !j.job_title || !j.job_apply_link) return null;
  const location =
    j.job_location?.trim() ||
    [j.job_city, j.job_state, j.job_country].filter(Boolean).join(", ") ||
    (j.job_is_remote ? "Remote" : "");
  return {
    id: j.job_id,
    title: j.job_title,
    company: j.employer_name ?? "",
    location,
    applyUrl: j.job_apply_link,
    logo: j.employer_logo ?? null,
    salaryText: salaryText(j),
    // Trim the description — the ranker only needs a summary and full text is huge.
    description: (j.job_description ?? "").slice(0, 1200),
    employmentType: j.job_employment_type ?? null,
    remote: Boolean(j.job_is_remote),
    postedAt: j.job_posted_at_datetime_utc ?? null,
    source: "jsearch",
  };
}

export const jsearchProvider: JobProvider = {
  name: "jsearch",

  async search(params: JobSearchParams): Promise<JobListing[]> {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      throw new Error(
        "Job search is not configured yet (missing RAPIDAPI_KEY). Add your RapidAPI/JSearch key to enable it.",
      );
    }

    const query = [params.query, params.location]
      .filter((s) => s && s.trim())
      .join(" in ");
    // /search (v1) was retired → 404. Current endpoint is /search-v2, which
    // returns { data: { jobs: [...] } } and no longer takes `page` (cursor-based).
    const url = new URL(`https://${HOST}/search-v2`);
    url.searchParams.set("query", params.remoteOnly ? `${query} remote` : query);
    url.searchParams.set("num_pages", String(params.numPages ?? 1));
    url.searchParams.set("date_posted", "month");

    const res = await withRetry(
      async () => {
        const r = await fetch(url, {
          headers: { "X-RapidAPI-Key": key, "X-RapidAPI-Host": HOST },
        });
        if (!r.ok) {
          const body = await r.text().catch(() => "");
          const err = new Error(rapidApiMessage(r.status, body)) as Error & {
            status?: number;
          };
          err.status = r.status;
          throw err;
        }
        return r;
      },
      { onRetry: (err, attempt) => logger.warn("jsearch retry", { attempt, err }) },
    );

    const data = (await res.json()) as { data?: { jobs?: JSearchJob[] } };
    const rows = Array.isArray(data.data?.jobs) ? data.data!.jobs! : [];
    return rows
      .map(normalize)
      .filter((j): j is JobListing => j !== null);
  },
};
