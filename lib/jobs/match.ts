/**
 * Turn a CV into a job search + rank the results against it with Claude.
 *
 * `queryFromCv` derives a sensible default search (role + location) so the user
 * gets matches on one click. `rankJobs` scores each listing 0-100 against the
 * candidate and writes a one-line reason — best-effort: if Claude is
 * unavailable the listings are returned unranked rather than failing the search.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CVData } from "@/types/cv";
import type { JobListing } from "@/types/jobs";
import { logger } from "@/lib/log";
import { CLAUDE_TEXT_MODEL } from "@/lib/ai/models";

const MODEL = CLAUDE_TEXT_MODEL;
/** Cap how many listings we send to the ranker to bound token cost. */
const MAX_RANK = 15;

export function queryFromCv(cv: CVData): { query: string; location: string } {
  const role =
    cv.experience.find((e) => e.role?.trim())?.role?.trim() ||
    cv.skills.slice(0, 3).filter(Boolean).join(" ") ||
    "";
  const location = [cv.personal.city, cv.personal.country]
    .filter((s) => s && s.trim())
    .join(", ");
  return { query: role, location };
}

/** Compact one-paragraph candidate summary for the ranking prompt. */
function candidateSummary(cv: CVData): string {
  const roles = cv.experience
    .slice(0, 3)
    .map((e) => [e.role, e.company && `at ${e.company}`, e.duration].filter(Boolean).join(" "))
    .join("; ");
  return [
    `Objective: ${cv.objective || "(none)"}`,
    `Experience: ${roles || "(none)"}`,
    `Skills: ${cv.skills.slice(0, 15).join(", ") || "(none)"}`,
    `Education: ${cv.education.map((e) => [e.degree, e.institution].filter(Boolean).join(", ")).join("; ") || "(none)"}`,
    `Certificates: ${cv.certificates.map((c) => c.name).filter(Boolean).join("; ") || "(none)"}`,
  ].join("\n");
}

export async function rankJobs(
  cv: CVData,
  jobs: JobListing[],
): Promise<JobListing[]> {
  if (jobs.length === 0) return jobs;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return jobs;

  const subset = jobs.slice(0, MAX_RANK);
  // Hard-bound the ranking call: ranking is a best-effort enhancement, so a
  // slow model response must not stall the request until the edge proxy 502s.
  const anthropic = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });

  const jobLines = subset
    .map(
      (j, i) =>
        `[${i}] ${j.title} — ${j.company || "?"} (${j.location || "?"})\n${j.description.slice(0, 400)}`,
    )
    .join("\n\n");

  const system = `You are a career-matching engine. Given a candidate profile and a numbered list of job postings, score how well each job fits the candidate.

Return ONLY a JSON array (no prose, no markdown fences), one object per job, in this exact shape:
[{"i": <job index>, "score": <integer 0-100>, "reason": "<max 15 words, in English>"}]

Scoring guidance: 80-100 = strong fit (role + skills align), 50-79 = plausible fit, below 50 = weak fit. Base it on role relevance, required vs. held skills, and seniority. Never invent facts about the candidate.`;

  const user = `CANDIDATE:\n${candidateSummary(cv)}\n\nJOBS:\n${jobLines}\n\nReturn the JSON array now.`;

  try {
    // The SDK handles its own timeout + one retry; no outer withRetry so the
    // total time stays bounded (~40s worst case, usually <10s).
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return jobs;

    const jsonText = block.text.slice(
      block.text.indexOf("["),
      block.text.lastIndexOf("]") + 1,
    );
    const parsed = JSON.parse(jsonText) as {
      i: number;
      score: number;
      reason: string;
    }[];

    for (const r of parsed) {
      const job = subset[r.i];
      if (!job) continue;
      job.score = Math.max(0, Math.min(100, Math.round(r.score)));
      job.reason = typeof r.reason === "string" ? r.reason : undefined;
    }
  } catch (err) {
    logger.warn("job ranking failed; returning unranked", { err });
    return jobs;
  }

  // Ranked subset first (score desc), then any overflow unranked jobs.
  const rankedIds = new Set(subset.map((j) => j.id));
  const ranked = [...subset].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  const overflow = jobs.filter((j) => !rankedIds.has(j.id));
  return [...ranked, ...overflow];
}
