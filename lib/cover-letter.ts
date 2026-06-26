import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language } from "@/types/cv";
import { withRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/log";

const MODEL = "claude-sonnet-4-6";

const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  it: "Italian",
  ar: "Arabic",
  ur: "Urdu",
};

export interface CoverLetterOptions {
  targetRole?: string;
  company?: string;
  language: Language;
}

/** Generate a concise professional cover letter from the CV + an optional target. */
export async function generateCoverLetter(
  cv: CVData,
  opts: CoverLetterOptions,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  const anthropic = new Anthropic({ apiKey });

  const langName = LANGUAGE_NAME[opts.language] ?? "English";
  const top = cv.experience[0];

  const system = `You are an expert career writer. Write a concise, professional cover letter in ${langName}.
Rules:
- 3 to 4 short paragraphs. Warm but professional.
- Plain text ONLY — no markdown, no headings, no bullet points, no placeholders like [Company].
- Open with a greeting and close with a sign-off using the candidate's name.
- If no target role/company is given, write a strong general letter for the candidate's field.
- Do not invent qualifications the candidate doesn't have.`;

  const user = `Candidate details:
Name: ${cv.personal.full_name}
Most recent role: ${[top?.role, top?.company && `at ${top.company}`].filter(Boolean).join(" ")}
Top skills: ${cv.skills.slice(0, 8).join(", ")}
Professional objective: ${cv.objective}
Key achievements: ${cv.achievements.filter((a) => a.trim()).join("; ")}
${opts.targetRole ? `Target role: ${opts.targetRole}` : ""}
${opts.company ? `Target company: ${opts.company}` : ""}

Write the cover letter now.`;

  const response = await withRetry(
    () =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 900,
        system,
        messages: [{ role: "user", content: user }],
      }),
    { onRetry: (err, attempt) => logger.warn("cover letter retry", { attempt, err }) },
  );

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text.trim();
}
