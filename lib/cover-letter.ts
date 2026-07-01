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

const DATE_LOCALE: Record<Language, string> = {
  en: "en-GB", // "1 July 2026"
  it: "it-IT",
  ar: "ar",
  ur: "ur-PK",
};

function todayIn(language: Language): string {
  return new Date().toLocaleDateString(DATE_LOCALE[language] ?? "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
  const today = todayIn(opts.language);
  const top = cv.experience[0];

  const system = `You are an expert career writer. Write a polished cover letter in ${langName} using a FORMAL BUSINESS-LETTER format.

Output the letter as PLAIN TEXT (no markdown, no bold markers, no bullet points, no placeholders in square brackets), with the parts in EXACTLY this order and separated by blank lines:

1. The date on its own line: ${today}
2. The recipient block, each item on its OWN line (single line breaks, no blank lines between them):
   - "Hiring Manager"
   - the company name, if a target company is provided
   Do NOT invent a department, street address, or a contact person's name.
3. A subject line that begins with "Re: " and names the target role (and company if provided). OMIT this whole line if no target role is provided.
4. The greeting: "Dear Hiring Manager,"
5. The body — 4 to 5 well-structured paragraphs, each on a single line:
   - Paragraph 1: express interest in the specific role, summarise who the candidate is (years of experience and field), and why they are excited about this opportunity.
   - Paragraph 2: describe the most recent role's responsibilities and achievements, then earlier relevant experience.
   - Paragraph 3: highlight role-relevant strengths, working style, and the concrete value they would bring to the employer.
   - Paragraph 4: mention relevant qualifications, certifications, education, and any compliance/skills from the CV.
   - Final paragraph: a warm close — honoured to contribute, available for an interview at their convenience, and a brief thank-you.
6. The sign-off "Warm regards," on its own line, then the candidate's full name on the next line.

Rules:
- Do NOT put the candidate's name, email, or phone as a header at the very top — that letterhead is added separately. START the letter with the date.
- Warm, confident, and professional. Vary sentence structure; avoid clichés and repetition.
- Do NOT invent facts (employers, dates, qualifications) beyond what the candidate provided.
- Separate every numbered part above with ONE blank line. Keep the recipient block lines together with single line breaks.`;

  const user = `Candidate details:
Name: ${cv.personal.full_name}
Most recent role: ${[top?.role, top?.company && `at ${top.company}`].filter(Boolean).join(" ")}
Prior experience: ${cv.experience.slice(1, 3).map((e) => [e.role, e.company && `at ${e.company}`].filter(Boolean).join(" ")).join("; ")}
Top skills: ${cv.skills.slice(0, 10).join(", ")}
Education: ${cv.education.map((e) => [e.degree, e.institution].filter(Boolean).join(", ")).join("; ")}
Certifications: ${cv.certificates.map((c) => c.name).filter(Boolean).join("; ")}
Professional objective: ${cv.objective}
Key achievements: ${cv.achievements.filter((a) => a.trim()).join("; ")}
Target role: ${opts.targetRole || "(not specified — write a strong general letter for the candidate's field)"}
Target company: ${opts.company || "(not specified — address it to the Hiring Manager and omit the company line)"}

Write the cover letter now, following the format exactly.`;

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
