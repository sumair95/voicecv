import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language, QAPair } from "@/types/cv";

const MODEL = "claude-sonnet-4-6";

const LANGUAGE_NAME: Record<Language, string> = {
  en: "English",
  ar: "Arabic",
  ur: "Urdu",
  hi: "Hindi",
};

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a professional CV writer specializing in the Saudi Arabian and Gulf job market, with deep knowledge of how to position blue-collar, technical, and skilled workers for employment.

Return ONLY a valid JSON object — no markdown fences, no prose, no explanation.

JSON shape (every field is required; use empty string/array/null if not provided):
{
  "personal": {
    "full_name": "string",
    "nationality": "string",
    "city": "string",
    "email": "string",
    "phone": "string"
  },
  "objective": "2-3 sentence professional objective derived from the candidate's goals + experience",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string (e.g. '2 years' or 'Jan 2022 - Present')",
      "description": "2-3 short bullet-style sentences describing responsibilities and achievements. Use \\n for line breaks if listing multiple."
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
  "achievement": null OR {
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  }
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
- achievement        → achievement (STAR object); if user skipped or said "no", return null

Quality rules:
- Write all natural-language content in {{LANGUAGE_NAME}}.
- Do NOT invent facts (companies, dates, qualifications). If information is missing, return empty string/array/null.
- Make the objective compelling and specific to the role + market the candidate wants.
- Normalize phone numbers to international format if obvious (e.g. +966).
- For skills, prefer specific items ("Toyota forklift licence", "MIG welding", "Arabic + English speaking") over vague ones ("hardworking", "team player").`;

export async function generateCV(
  qaPairs: QAPair[],
  language: Language,
): Promise<CVData> {
  const anthropic = client();

  const qaBlock = qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} [${qa.field_key}] ${qa.question}\nA${i + 1}: ${qa.answer}`,
    )
    .join("\n\n");

  const userMessage = `Language: ${LANGUAGE_NAME[language]}

Questions and answers from the job seeker:

${qaBlock}

Generate the structured CV JSON now.`;

  const system = SYSTEM_PROMPT.replace(
    "{{LANGUAGE_NAME}}",
    LANGUAGE_NAME[language],
  );

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2500,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

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
      email: parsed.personal?.email ?? "",
      phone: parsed.personal?.phone ?? "",
    },
    objective: parsed.objective ?? "",
    experience: parsed.experience ?? [],
    education: parsed.education ?? [],
    certificates: parsed.certificates ?? [],
    skills: parsed.skills ?? [],
    languages: parsed.languages ?? [],
    hobbies: parsed.hobbies ?? [],
    achievement: parsed.achievement ?? null,
  };
}
