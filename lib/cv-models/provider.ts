/**
 * CV-model abstraction. Each provider turns the candidate's answers into a
 * structured CV. Multiple providers compete; a blind judge scores each and the
 * highest-rated CV wins (see ./generate.ts). New models (Grok, Gemini, …) slot
 * in by implementing this interface — same pattern as lib/jobs/provider.ts.
 */

import type { CVData, Language } from "@/types/cv";

export interface CVModelProvider {
  /** Stable id logged with every score (e.g. "claude-sonnet-4-6", "gpt-4o"). */
  readonly name: string;
  /** True only when the provider's API key is present — unconfigured ones are skipped. */
  isConfigured(): boolean;
  generate(
    qaPairs: import("@/types/cv").QAPair[],
    language: Language,
    outputLanguage: Language,
  ): Promise<CVData>;
}
