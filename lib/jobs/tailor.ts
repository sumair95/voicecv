/**
 * Tailor a CV to a specific job — rewrite the objective, experience wording, and
 * skill ordering to match the job's keywords WITHOUT inventing anything. Returns
 * the same CVData shape (parsed + backfilled).
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language } from "@/types/cv";
import { LANGUAGE_NAME } from "@/lib/cv-models/prompt";
import { parseCVJson } from "@/lib/cv-models/parse";

const MODEL = "claude-sonnet-4-6";

export async function tailorCV(
  cv: CVData,
  jobTitle: string,
  jobDescription: string,
  outputLanguage: Language,
): Promise<CVData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const anthropic = new Anthropic({ apiKey, timeout: 40_000, maxRetries: 1 });
  const langName = LANGUAGE_NAME[outputLanguage] ?? "English";

  const system = `You are a professional CV writer. Rewrite the candidate's CV to target ONE specific job so it reads as a strong match and passes ATS keyword screening — WITHOUT inventing anything.

Hard rules:
- Keep EVERY fact unchanged: same employers, roles, dates/durations, education, certificates, contact details. Never add a job, employer, date, or qualification the candidate does not have.
- Rewrite personal.job_title and the objective to target this specific job/role.
- Rephrase EXPERIENCE bullets to use the job's terminology and put the most relevant achievements first. Reframe real duties with the job's keywords; do not invent new duties.
- Reorder SKILLS so the job-relevant ones come first. Add a skill ONLY if the existing experience clearly demonstrates it.
- Write everything in ${langName}.
- Return ONLY the same JSON object shape you were given — no prose, no markdown.`;

  const user = `CURRENT CV (JSON):\n${JSON.stringify(cv)}\n\nTARGET JOB:\n${jobTitle}\n${jobDescription.slice(0, 2000)}\n\nReturn the tailored CV as JSON now (same shape, written in ${langName}).`;

  const resp = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = resp.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No tailored CV returned");
  return parseCVJson(block.text);
}
