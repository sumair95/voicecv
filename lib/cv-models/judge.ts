/**
 * Blind CV judge. Scores each candidate CV 0–10 against a rubric WITHOUT being
 * told which model produced it (candidates are shuffled + labelled A/B/C), so a
 * model can't be favoured for its own output. Faithfulness (no invented facts)
 * is weighted heaviest — a CV must never fabricate employers/dates/skills.
 *
 * Best-effort: if the judge call fails, callers fall back to the default model.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CVData, QAPair } from "@/types/cv";
import { logger } from "@/lib/log";

const JUDGE_MODEL = "claude-sonnet-4-6";
const LABELS = "ABCDEFGH";

function candidateSummary(cv: CVData): string {
  return JSON.stringify({
    objective: cv.objective,
    experience: cv.experience,
    skills: cv.skills,
    education: cv.education,
    certificates: cv.certificates,
    achievements: cv.achievements,
    languages: cv.languages,
  });
}

/**
 * Returns a score in [0,10] for each candidate, aligned to the input order.
 * On any failure every candidate gets 0 (caller then keeps its default pick).
 */
export async function scoreCVs(
  qaPairs: QAPair[],
  candidates: CVData[],
): Promise<number[]> {
  if (candidates.length === 0) return [];
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return candidates.map(() => 0);

  // Shuffle so the label order carries no signal about which model made which.
  const order = candidates.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const source = qaPairs
    .map((qa) => `[${qa.field_key}] ${qa.answer}`)
    .filter((s) => s.trim())
    .join("\n");

  const blocks = order
    .map((idx, pos) => `CV ${LABELS[pos]}:\n${candidateSummary(candidates[idx])}`)
    .join("\n\n");

  const system = `You are a strict CV-quality judge. You are given the candidate's raw answers and several finished CVs (labelled A, B, …) built from them. Score each CV from 0 to 10.

Rubric (weight):
- Faithfulness (40%): does NOT invent employers, dates, qualifications, or skills the answers don't support. Fabrication is the worst failure — score it low.
- Completeness (25%): captures the real experience, skills, and achievements present in the answers.
- Professionalism (20%): strong objective, action-verb bullets, well-structured.
- Language quality (15%): clean, professional, correct.

Return ONLY a JSON array, one object per CV, no prose:
[{"label": "A", "score": <integer 0-10>}]`;

  const user = `CANDIDATE ANSWERS:\n${source || "(none)"}\n\nCANDIDATE CVs:\n${blocks}\n\nReturn the JSON scores now.`;

  try {
    const anthropic = new Anthropic({ apiKey, timeout: 25_000, maxRetries: 1 });
    const response = await anthropic.messages.create({
      model: JUDGE_MODEL,
      max_tokens: 400,
      system,
      messages: [{ role: "user", content: user }],
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return candidates.map(() => 0);

    const text = block.text;
    const parsed = JSON.parse(
      text.slice(text.indexOf("["), text.lastIndexOf("]") + 1),
    ) as { label: string; score: number }[];

    const scores = candidates.map(() => 0);
    for (const r of parsed) {
      const pos = LABELS.indexOf((r.label ?? "").trim().toUpperCase());
      if (pos < 0 || pos >= order.length) continue;
      const originalIdx = order[pos];
      const s = Math.max(0, Math.min(10, Math.round(Number(r.score))));
      if (!Number.isNaN(s)) scores[originalIdx] = s;
    }
    return scores;
  } catch (err) {
    logger.warn("cv judge failed; scores default to 0", { err });
    return candidates.map(() => 0);
  }
}
