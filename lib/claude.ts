import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language, QAPair } from "@/types/cv";
import { withRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/log";

const MODEL = "claude-sonnet-4-6";

/** Exported so callers can record which model produced a CV (edit-diff learning). */
export const CV_MODEL = MODEL;

const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  it: "Italian",
  ar: "Arabic",
  ur: "Urdu",
};

/**
 * Which language the finished CV is written in.
 * - Italian input → Italian CV (for the Italian job market).
 * - Everything else (English / Arabic / Urdu) → English CV, so Gulf recruiters
 *   worldwide can read it (the original product decision).
 * Both outputs are Latin-script and LTR, so PDF/preview rendering is unaffected.
 */
export function outputLanguageFor(input: Language): Language {
  return input === "it" ? "it" : "en";
}

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

const buildSystemPrompt = (outputLanguage: string) =>
  `You are a professional CV writer who knows how to position blue-collar, technical, and skilled workers for employment in both the Gulf and European job markets.

The candidate may have answered the voice questions in any language. You MUST write the final CV in **${outputLanguage}** so the target recruiters can read it. Translate any other-language content into clear, professional ${outputLanguage}.

Return ONLY a valid JSON object — no markdown fences, no prose, no explanation.

JSON shape (every field is required; use empty string/array/null if not provided):
{
  "personal": {
    "full_name": "string",
    "nationality": "string",
    "city": "string",
    "country": "string (country of residence — distinct from nationality)",
    "email": "string",
    "phone": "string"
  },
  "socials": [
    { "url": "string (full https URL to a portfolio / GitHub / LinkedIn / etc. — extract only if the user explicitly mentioned a link or handle)" }
  ],
  "objective": "2-3 sentence professional objective derived from the candidate's goals + experience",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string (e.g. '2 years' or 'Jan 2022 - Present')",
      "description": "3-4 SHORT achievement bullets. ONE bullet per LINE, separated by \\n. Do NOT include bullet markers (-, •, *) — the renderer adds them. Start each line with an action verb (e.g. 'Operated…', 'Led…', 'Delivered…')."
    }
  ],
  "education": [
    { "institution": "string", "degree": "string", "year": "string" }
  ],
  "certificates": [
    { "name": "string", "issuer": "string", "year": "string" }
  ],
  "skills": ["specific skill", "tool", "licence", "software"],
  "languages": [
    { "name": "string", "proficiency": "beginner | conversational | fluent" }
  ],
  "hobbies": ["hobby1", "hobby2"],
  "achievements": ["short achievement or award, e.g. 'Employee of the Month 2023', 'Top sales performer Q2', 'Completed 500+ deliveries with zero accidents'"]
}

Mapping rules — the user has answered up to 9 questions identified by field_key:
- personal           → personal.full_name, nationality, city, email, phone
- recent_job         → experience[0] (most recent / current)
- previous_roles     → experience[1..] (older jobs)
- skills             → skills[]
- spoken_languages   → languages[] (parse name + proficiency)
- education          → education[]
- certificates       → certificates[]
- hobbies            → hobbies[]
- achievement        → achievements[] (each a SHORT one-line achievement or award; keep the candidate's own wording, just tidy it. If they skipped or said "no", return [])

Quality rules:
- Write ALL natural-language content in **${outputLanguage}**, regardless of the candidate's input language. Personal names, city names, and country names should be written in Latin script (e.g. "أحمد" → "Ahmed", "ریاض" → "Riyadh").
- Do NOT invent facts (companies, dates, qualifications). If information is missing OR the user skipped the question (empty answer), return empty string/array/null for those fields.
- Make the objective compelling and specific to the role + market the candidate wants.
- Normalize phone numbers to international format if obvious (e.g. +966, +39).
- For skills, prefer specific items ("Toyota forklift licence", "MIG welding", "fluent in English + Italian") over vague ones ("hardworking", "team player").
- Experience descriptions MUST be newline-separated bullets, one achievement per line, no markers.
- Languages section: if the candidate natively speaks a language other than the CV language, list it — that's a real CV asset, not a translation problem.`;

export async function generateCV(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language = outputLanguageFor(language),
): Promise<CVData> {
  const anthropic = client();

  const qaBlock = qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.field_key}] ${qa.question}\nA${i + 1}: ${qa.answer}`,
    )
    .join("\n\n");

  const outputName = LANGUAGE_NAME[outputLanguage];

  const userMessage = `The candidate answered the questions in: ${LANGUAGE_NAME[language]}.
Write the CV in ${outputName} — translate from ${LANGUAGE_NAME[language]} where needed.

Questions and answers from the job seeker:

${qaBlock}

Generate the structured CV JSON now (${outputName}).`;

  const response = await withRetry(
    () =>
      anthropic.messages.create({
        model: MODEL,
        max_tokens: 2500,
        system: buildSystemPrompt(outputName),
        messages: [{ role: "user", content: userMessage }],
      }),
    {
      onRetry: (err, attempt) =>
        logger.warn("claude retry", { attempt, err }),
    },
  );

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content");
  }

  const raw = textBlock.text.trim();
  const jsonStart = raw.indexOf("{");
  const jsonEnd = raw.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error("Claude response did not contain JSON");
  }

  const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as CVData;
  // Backfill arrays/keys in case Claude returns a sparse object.
  return {
    personal: {
      full_name: parsed.personal?.full_name ?? "",
      nationality: parsed.personal?.nationality ?? "",
      city: parsed.personal?.city ?? "",
      country: parsed.personal?.country ?? "",
      email: parsed.personal?.email ?? "",
      phone: parsed.personal?.phone ?? "",
    },
    socials: Array.isArray(parsed.socials) ? parsed.socials : [],
    objective: parsed.objective ?? "",
    experience: parsed.experience ?? [],
    education: parsed.education ?? [],
    certificates: parsed.certificates ?? [],
    skills: parsed.skills ?? [],
    languages: parsed.languages ?? [],
    hobbies: parsed.hobbies ?? [],
    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
  };
}
