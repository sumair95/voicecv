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
/** Hard cap per JSearch request so a slow/hung upstream can't stall the whole
 * route until the edge proxy 502s. */
const FETCH_TIMEOUT_MS = 12_000;

async function fetchWithTimeout(url: URL, init: RequestInit): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      const e = new Error("Job search timed out — the provider took too long.") as Error & {
        status?: number;
      };
      e.status = 504; // non-retriable-ish; surfaces a clean message
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

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

    const numPages = params.numPages ?? 1;
    const datePosted = params.datePosted ?? "all";

    // /search (v1) was retired → 404. Current endpoint is /search-v2, which
    // returns { data: { jobs: [...] } } and no longer takes `page` (cursor-based).
    const runQuery = async (query: string): Promise<JobListing[]> => {
      const url = new URL(`https://${HOST}/search-v2`);
      url.searchParams.set("query", params.remoteOnly ? `${query} remote` : query);
      url.searchParams.set("num_pages", String(numPages));
      url.searchParams.set("date_posted", datePosted);
      // The country param is what makes non-US markets return results at all.
      if (params.country) url.searchParams.set("country", params.country);

      const res = await withRetry(
        async () => {
          const r = await fetchWithTimeout(url, {
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
        {
          attempts: 2, // bound worst-case latency (2 × 12s) well under the edge timeout
          onRetry: (err, attempt) => logger.warn("jsearch retry", { attempt, err }),
        },
      );

      const data = (await res.json()) as { data?: { jobs?: JSearchJob[] } };
      const rows = Array.isArray(data.data?.jobs) ? data.data!.jobs! : [];
      return rows.map(normalize).filter((j): j is JobListing => j !== null);
    };

    const located = [params.query, params.location]
      .filter((s) => s && s.trim())
      .join(" in ");

    let jobs = await runQuery(located);
    // Fallback: a too-specific "role in city" sometimes over-narrows to zero
    // even when the country has plenty of matches. Retry with the role alone
    // (country still scopes the market).
    if (jobs.length === 0 && params.location && params.country) {
      logger.info("jsearch empty with location; retrying role-only", {
        country: params.country,
      });
      jobs = await runQuery(params.query);
    }
    return jobs;
  },
};
