import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language, QAPair } from "@/types/cv";

const MODEL = "claude-sonnet-4-6";

function client() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

const SYSTEM_PROMPT = `You are a professional CV writer specializing in the Saudi Arabian and Middle East job market.

Return ONLY a valid JSON object — no markdown fences, no prose, no explanation.

JSON shape:
{
  "personal": { "full_name": "string", "city": "string", "email": "", "phone": "" },
  "objective": "2-3 sentence professional objective statement",
  "experience": [
    { "company": "string", "role": "string", "duration": "string", "description": "2-3 bullet points describing achievements" }
  ],
  "education": [ { "institution": "string", "degree": "string", "year": "string" } ],
  "skills": ["skill1", "skill2"],
  "languages": ["Arabic", "English"]
}

Rules:
- Fill in gaps intelligently based on context, but do not invent data.
- If information is missing, return an empty string or empty array — do not invent it.
- Write all natural-language content in the requested language.
- Make the objective compelling and specific to the role they want.`;

export async function generateCV(
  qaPairs: QAPair[],
  language: Language,
): Promise<CVData> {
  const anthropic = client();

  const qaBlock = qaPairs
    .map(
      (qa, i) =>
        `Q${i + 1} (${qa.field_key}): ${qa.question}\nA${i + 1}: ${qa.answer}`,
    )
    .join("\n\n");

  const userMessage = `Language: ${language === "ar" ? "Arabic" : "English"}

Questions and answers from the job seeker:

${qaBlock}

Generate the structured CV JSON now.`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
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
  return parsed;
}
