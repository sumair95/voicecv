/**
 * Adzuna provider — backup/second source behind JSearch.
 *
 * Why: JSearch (Google-for-Jobs aggregate) is thin/absent in some markets —
 * notably **Australia** — and occasionally hangs from Railway's IP. Adzuna is a
 * separate API with strong AU/UK/US/EU/Canada/India coverage, so it fills the
 * gap and gives the search a real fallback when JSearch fails.
 *
 * Requires TWO credentials (both free): `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`.
 * Read lazily so the app boots without them; if absent, this provider throws a
 * clear "not configured" error and the orchestrator falls through.
 *
 * Docs: https://developer.adzuna.com/  (GET /v1/api/jobs/{country}/search/{page})
 */

import type { JobProvider, JobSearchParams } from "./provider";
import type { JobListing } from "@/types/jobs";
import { withRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/log";

const BASE = "https://api.adzuna.com/v1/api/jobs";
/** Hard cap per Adzuna request so a slow upstream can't stall the route. */
const FETCH_TIMEOUT_MS = 18_000;

/** Countries Adzuna actually serves (their API only accepts these). */
const SUPPORTED = new Set([
  "gb", "us", "at", "au", "be", "br", "ca", "ch", "de",
  "es", "fr", "in", "it", "mx", "nl", "nz", "pl", "sg", "za",
]);

/** Map our datePosted filter to Adzuna's `max_days_old` (omit for "all"). */
const MAX_DAYS_OLD: Record<string, number | undefined> = {
  all: undefined,
  today: 1,
  "3days": 3,
  week: 7,
  month: 30,
};

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
      e.status = 504;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Raw Adzuna result shape (only the fields we consume). */
interface AdzunaJob {
  id?: string;
  title?: string;
  company?: { display_name?: string };
  location?: { display_name?: string; area?: string[] };
  redirect_url?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  salary_is_predicted?: string;
  contract_time?: string | null; // "full_time" | "part_time"
  contract_type?: string | null; // "permanent" | "contract"
  created?: string;
}

function salaryText(j: AdzunaJob): string | null {
  const { salary_min: min, salary_max: max } = j;
  if (!min && !max) return null;
  const fmt = (n: number) => Math.round(n).toLocaleString();
  const range = min && max ? `${fmt(min)}–${fmt(max)}` : fmt((min ?? max) as number);
  // Adzuna salaries are annual; mark predicted ones so we don't over-promise.
  const suffix = j.salary_is_predicted === "1" ? " (est.)" : "";
  return `${range}/yr${suffix}`;
}

function employmentType(j: AdzunaJob): string | null {
  const parts = [j.contract_time, j.contract_type]
    .filter(Boolean)
    .map((s) => (s as string).replace(/_/g, " "));
  return parts.length ? parts.join(", ") : null;
}

function normalize(j: AdzunaJob): JobListing | null {
  if (!j.id || !j.title || !j.redirect_url) return null;
  return {
    // Namespace the id so it can never collide with a JSearch id in the tracker.
    id: `adzuna:${j.id}`,
    title: j.title,
    company: j.company?.display_name ?? "",
    location: j.location?.display_name ?? j.location?.area?.join(", ") ?? "",
    applyUrl: j.redirect_url,
    logo: null, // Adzuna doesn't return employer logos.
    salaryText: salaryText(j),
    description: (j.description ?? "").slice(0, 1200),
    employmentType: employmentType(j),
    remote: /\bremote\b/i.test(`${j.title} ${j.description ?? ""}`),
    postedAt: j.created ?? null,
    source: "adzuna",
  };
}

export const adzunaProvider: JobProvider = {
  name: "adzuna",

  async search(params: JobSearchParams): Promise<JobListing[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      throw new Error(
        "Adzuna is not configured (missing ADZUNA_APP_ID / ADZUNA_APP_KEY).",
      );
    }

    // Adzuna requires a supported country in the URL path; default to gb only
    // when none is known (better a real market than a 404).
    const country = params.country && SUPPORTED.has(params.country) ? params.country : undefined;
    if (params.country && !country) {
      // e.g. Pakistan / Gulf — Adzuna simply doesn't cover it. Treat as "no
      // results from this provider" so the orchestrator moves on cleanly.
      logger.info("adzuna skip: unsupported country", { country: params.country });
      return [];
    }

    const resultsPerPage = Math.min(50, (params.numPages ?? 1) * 20);
    const maxDaysOld = MAX_DAYS_OLD[params.datePosted ?? "all"];

    const runQuery = async (what: string): Promise<JobListing[]> => {
      const url = new URL(`${BASE}/${country ?? "gb"}/search/1`);
      url.searchParams.set("app_id", appId);
      url.searchParams.set("app_key", appKey);
      url.searchParams.set("results_per_page", String(resultsPerPage));
      url.searchParams.set("what", params.remoteOnly ? `${what} remote` : what);
      if (params.location) url.searchParams.set("where", params.location);
      if (maxDaysOld) url.searchParams.set("max_days_old", String(maxDaysOld));
      url.searchParams.set("content-type", "application/json");

      const res = await withRetry(
        async () => {
          const r = await fetchWithTimeout(url, { headers: { Accept: "application/json" } });
          if (!r.ok) {
            const body = await r.text().catch(() => "");
            const msg =
              r.status === 401 || r.status === 403
                ? "Adzuna credentials were rejected (check ADZUNA_APP_ID / ADZUNA_APP_KEY)."
                : `Adzuna provider error (HTTP ${r.status}).`;
            const err = new Error(msg) as Error & { status?: number };
            err.status = r.status;
            logger.warn("adzuna http error", { status: r.status, body: body.slice(0, 200) });
            throw err;
          }
          return r;
        },
        {
          attempts: 2,
          onRetry: (err, attempt) => logger.warn("adzuna retry", { attempt, err }),
        },
      );

      const data = (await res.json()) as { results?: AdzunaJob[] };
      const rows = Array.isArray(data.results) ? data.results : [];
      return rows.map(normalize).filter((j): j is JobListing => j !== null);
    };

    const jobs = await runQuery(params.query);
    // Adzuna's `where` is already the location filter and the country path is
    // the market, so there's no useful "retry without narrowing" like JSearch.
    if (jobs.length === 0) {
      logger.info("adzuna empty", { country: country ?? "gb", query: params.query });
    }
    return jobs;
  },
};
