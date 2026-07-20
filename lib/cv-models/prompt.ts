/**
 * Shared CV-generation prompt — used by every model provider (Claude, OpenAI,
 * …) so they all produce the same JSON CV shape and can be compared fairly.
 *
 * Extracted from lib/claude.ts (the original single-model path) so there is one
 * source of truth for the prompt across providers.
 */

import type { Language, QAPair } from "@/types/cv";
import { styleGuidelines } from "@/lib/prompts/guidelines";

export const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  it: "Italian",
  ar: "Arabic",
  ur: "Urdu",
};

export const buildSystemPrompt = (outputLanguage: string) => {
  const g = styleGuidelines();
  const guide = g
    ? `# STYLE GUIDELINES — apply to ALL wording (banned words to avoid, strong action verbs, quantify achievements, "show don't tell", market-specific rules). These shape the CONTENT. The JSON schema and rules AFTER them are AUTHORITATIVE for structure and output format.\n\n${g}\n\n# END STYLE GUIDELINES\n\n`
    : "";
  return `${guide}You are a professional CV writer who knows how to position blue-collar, technical, and skilled workers for employment in both the Gulf and European job markets.

The candidate may have answered the voice questions in any language. You MUST write the final CV in **${outputLanguage}** so the target recruiters can read it. Translate any other-language content into clear, professional ${outputLanguage}.

Return ONLY a valid JSON object — no markdown fences, no prose, no explanation.

JSON shape (every field is required; use empty string/array/null if not provided):
{
  "personal": {
    "full_name": "string",
    "job_title": "string (a concise 2-4 word professional title/headline shown under the name, e.g. 'Construction Site Supervisor', 'Data Analyst', 'Delivery Driver' — derived from the most recent role or the job the candidate is targeting)",
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
- Write ALL natural-language content in **${outputLanguage}**, regardless of the candidate's input language. The finished CV MUST contain ZERO characters from the candidate's input script — transliterate EVERY name and place and translate ALL content into ${outputLanguage} (e.g. "أحمد"/"احمد" → "Ahmed", "ریاض" → "Riyadh", "کراچی" → "Karachi", "لاہور" → "Lahore"). Do NOT leave a single Arabic or Urdu character anywhere in the output — even one flips the text alignment and breaks the layout.
- Write in clear, professional, idiomatic ${outputLanguage} of consistent quality — the wording must read as if written natively in ${outputLanguage}, no matter which language the candidate answered in.
- Do NOT invent facts (companies, dates, qualifications). If information is missing OR the user skipped the question (empty answer), return empty string/array/null for those fields.
- Make the objective compelling and specific to the role + market the candidate wants.
- job_title: a short professional headline (2-4 words), not a sentence. If the candidate gave no role at all, leave it "".
- Normalize phone numbers to international format if obvious (e.g. +966, +39).
- For skills, prefer specific items ("Toyota forklift licence", "MIG welding", "fluent in English + Italian") over vague ones ("hardworking", "team player").
- Experience descriptions MUST be newline-separated bullets, one achievement per line, no markers.
- Languages section: if the candidate natively speaks a language other than the CV language, list it — that's a real CV asset, not a translation problem.`;
};

export function buildUserMessage(
  qaPairs: QAPair[],
  inputLanguage: Language,
  outputName: string,
  exemplars: string[] = [],
): string {
  const qaBlock = qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.field_key}] ${qa.question}\nA${i + 1}: ${qa.answer}`,
    )
    .join("\n\n");

  // Retrieval-augmented few-shot: strong, human-approved CVs for a similar role
  // guide STRUCTURE and QUALITY only. Identifiers are pre-stripped, and the
  // model is forbidden from copying any fact — every fact must come from THIS
  // candidate's answers above.
  const referenceBlock =
    exemplars.length > 0
      ? `\n\nREFERENCE — ${exemplars.length} strong, human-approved CV${exemplars.length > 1 ? "s" : ""} for a similar role. Use ONLY to guide structure, tone, bullet style, and the level of specificity. NEVER copy any fact (names, employers, dates, numbers, skills) from them — every fact in your output must come from THIS candidate's answers above. Personal identifiers have been removed.\n\n${exemplars
          .map((ex, i) => `Reference CV ${i + 1}:\n${ex}`)
          .join("\n\n")}`
      : "";

  return `The candidate answered the questions in: ${LANGUAGE_NAME[inputLanguage]}.
Write the CV in ${outputName}, in Latin script only — translate and transliterate everything from ${LANGUAGE_NAME[inputLanguage]}, and leave NO ${LANGUAGE_NAME[inputLanguage]} characters anywhere in the output.

Questions and answers from the job seeker:

${qaBlock}${referenceBlock}

Generate the structured CV JSON now (${outputName}).`;
}
