/**
 * Suggest realistic job titles a candidate is qualified for, to guide their
 * search (and give one-tap alternatives when their own term returns nothing).
 *
 * Claude produces the core role + close adjacent/synonym titles recruiters use.
 * Best-effort: on any failure it falls back to titles pulled straight from the
 * CV, so the feature degrades to "still useful" rather than empty.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CVData } from "@/types/cv";
import { logger } from "@/lib/log";
import { CLAUDE_TEXT_MODEL } from "@/lib/ai/models";

const MODEL = CLAUDE_TEXT_MODEL;

/** Titles straight off the CV — the zero-cost fallback. */
function fallbackRoles(cv: CVData): string[] {
  const set = new Set<string>();
  const jt = cv.personal.job_title?.trim();
  if (jt) set.add(jt);
  for (const e of cv.experience) {
    const r = e.role?.trim();
    if (r) set.add(r);
  }
  return Array.from(set).slice(0, 6);
}

export async function suggestRoles(cv: CVData): Promise<string[]> {
  const fallback = fallbackRoles(cv);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallback;

  const summary = [
    `Current/most recent title: ${cv.personal.job_title || "(none)"}`,
    `Experience: ${cv.experience.slice(0, 4).map((e) => e.role).filter(Boolean).join("; ") || "(none)"}`,
    `Skills: ${cv.skills.slice(0, 15).join(", ") || "(none)"}`,
  ].join("\n");

  const system = `You suggest realistic job titles a candidate is well-qualified for, to help them search job boards. Return ONLY a JSON array of 5-6 short, common job-board titles (2-4 words each), most relevant first. Include the candidate's core role PLUS close adjacent roles and the common synonyms recruiters actually use for them. English only. Do not stretch seniority beyond their experience. No prose, no markdown.`;
  const user = `CANDIDATE:\n${summary}\n\nReturn the JSON array of job titles now.`;

  try {
    const anthropic = new Anthropic({ apiKey, timeout: 15_000, maxRetries: 1 });
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = resp.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)) as unknown[];
    const roles = arr
      .filter((r): r is string => typeof r === "string")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    return roles.length > 0 ? roles : fallback;
  } catch (err) {
    logger.warn("suggestRoles failed; using CV fallback", { err });
    return fallback;
  }
}
