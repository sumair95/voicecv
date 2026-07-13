/**
 * Single-model CV helper (Claude). Kept for back-compat; new code should use
 * lib/cv-models/generate.generateBestCV, which runs the multi-model competition
 * when enabled and falls back to Claude otherwise. The prompt + parser now live
 * in lib/cv-models/ so every provider shares one source of truth.
 */

import type { CVData, Language, QAPair } from "@/types/cv";
import { claudeCVProvider, CLAUDE_CV_MODEL } from "@/lib/cv-models/claude";

/** Which model Claude-based CV generation uses. */
export const CV_MODEL = CLAUDE_CV_MODEL;

/**
 * Which language the finished CV is written in.
 * - Italian input → Italian CV (for the Italian job market).
 * - Everything else (English / Arabic / Urdu) → English CV, so Gulf recruiters
 *   worldwide can read it (the original product decision).
 */
export function outputLanguageFor(input: Language): Language {
  return input === "it" ? "it" : "en";
}

export async function generateCV(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language = outputLanguageFor(language),
): Promise<CVData> {
  return claudeCVProvider.generate(qaPairs, language, outputLanguage);
}
