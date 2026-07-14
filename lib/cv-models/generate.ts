/**
 * CV generation orchestrator.
 *
 * Fast path — `generatePrimaryCV`: generate with the primary (first configured)
 * model, Claude. Always used, always returned immediately.
 *
 * Competition — `runChallengers`: when CV_MULTI_MODEL is on and other models are
 * configured, generate with them too, blind-judge [primary + challengers], and
 * return the winner + all scores. The route runs this in the BACKGROUND after
 * responding, so the user never waits for it (see generate-cv route).
 *
 * `generateBestCV` composes both for callers that want the synchronous result
 * (e.g. the e2e test). Claude is always the guaranteed fallback and wins ties.
 *
 * New models (Grok, Gemini, …) drop into PROVIDERS — same pattern as lib/jobs.
 */

import type { CVData, Language, QAPair } from "@/types/cv";
import type { CVModelProvider } from "./provider";
import { claudeCVProvider } from "./claude";
import { openaiCVProvider } from "./openai";
import { scoreCVs } from "./judge";
import { logger } from "@/lib/log";

/** Registry, in preference order. Claude first = the guaranteed default/tie-break. */
const PROVIDERS: CVModelProvider[] = [claudeCVProvider, openaiCVProvider];

export interface ModelScore {
  model: string;
  score: number;
  won: boolean;
}

export interface GeneratedCV {
  cvData: CVData;
  model: string;
}

export interface BestCVResult extends GeneratedCV {
  scores: ModelScore[];
}

export interface ChallengerResult {
  scores: ModelScore[];
  /** The winning challenger's CV, or null when the primary (Claude) wins. */
  winner: GeneratedCV | null;
}

export function multiModelEnabled(): boolean {
  return process.env.CV_MULTI_MODEL === "true";
}

function configuredProviders(): CVModelProvider[] {
  return PROVIDERS.filter((p) => p.isConfigured());
}

/** True when a background competition would actually run (enabled + a challenger exists). */
export function hasChallengers(): boolean {
  return multiModelEnabled() && configuredProviders().length > 1;
}

/** Fast path — generate with the primary (first configured) model. */
export async function generatePrimaryCV(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language,
  exemplars: string[] = [],
): Promise<GeneratedCV> {
  const provider = configuredProviders()[0] ?? claudeCVProvider;
  const cvData = await provider.generate(qaPairs, language, outputLanguage, exemplars);
  return { cvData, model: provider.name };
}

/**
 * Generate with the challenger models, blind-judge them against the primary,
 * and return the winner (null if the primary wins) + every model's score.
 * Best-effort: a failed challenger is skipped; a failed judge leaves the
 * primary as winner.
 */
export async function runChallengers(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language,
  exemplars: string[],
  primary: GeneratedCV,
): Promise<ChallengerResult> {
  const challengers = configuredProviders().filter((p) => p.name !== primary.model);
  if (challengers.length === 0) return { scores: [], winner: null };

  const results = await Promise.allSettled(
    challengers.map((p) => p.generate(qaPairs, language, outputLanguage, exemplars)),
  );

  // Index 0 is always the primary, so a tie or a judge failure keeps Claude.
  const candidates: GeneratedCV[] = [{ cvData: primary.cvData, model: primary.model }];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      candidates.push({ cvData: r.value, model: challengers[i].name });
    } else {
      logger.warn("challenger cv failed", { model: challengers[i].name, err: r.reason });
    }
  });
  if (candidates.length === 1) return { scores: [], winner: null };

  const judged = await scoreCVs(qaPairs, candidates.map((c) => c.cvData));

  let bestIdx = 0;
  for (let i = 1; i < candidates.length; i++) {
    if ((judged[i] ?? 0) > (judged[bestIdx] ?? 0)) bestIdx = i;
  }

  const scores: ModelScore[] = candidates.map((c, i) => ({
    model: c.model,
    score: judged[i] ?? 0,
    won: i === bestIdx,
  }));
  logger.info("cv multi-model pick", {
    winner: candidates[bestIdx].model,
    scores: scores.map((s) => `${s.model}:${s.score}`),
  });

  return { scores, winner: bestIdx === 0 ? null : candidates[bestIdx] };
}

/** Synchronous best-of-N (primary + challengers). Used by the e2e test. */
export async function generateBestCV(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language,
  exemplars: string[] = [],
): Promise<BestCVResult> {
  const primary = await generatePrimaryCV(qaPairs, language, outputLanguage, exemplars);
  if (!hasChallengers()) return { ...primary, scores: [] };

  const { scores, winner } = await runChallengers(
    qaPairs,
    language,
    outputLanguage,
    exemplars,
    primary,
  );
  return { ...(winner ?? primary), scores };
}
