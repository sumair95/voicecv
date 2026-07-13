/**
 * CV generation orchestrator.
 *
 * Flag OFF (default): behaves exactly like the original single-model path —
 * generate with Claude only. Zero added cost/latency; the live demo path is
 * untouched.
 *
 * Flag ON (CV_MULTI_MODEL=true): every configured model generates a CV in
 * parallel, a blind judge scores each 0–10, and the HIGHEST-rated CV is
 * returned. All per-model scores are returned so the caller can log them for
 * future validation. Claude is always the guaranteed fallback: if other models
 * or the judge fail, Claude's CV is used.
 *
 * New models (Grok, Gemini, …) are added by dropping a provider into PROVIDERS.
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

export interface BestCVResult {
  cvData: CVData;
  /** The model whose CV was chosen. */
  model: string;
  /** Per-model scores (empty in single-model mode). */
  scores: ModelScore[];
}

function multiModelEnabled(): boolean {
  return process.env.CV_MULTI_MODEL === "true";
}

export async function generateBestCV(
  qaPairs: QAPair[],
  language: Language,
  outputLanguage: Language,
): Promise<BestCVResult> {
  const configured = PROVIDERS.filter((p) => p.isConfigured());

  // Single-model mode (default) OR only one model available → original path.
  if (!multiModelEnabled() || configured.length <= 1) {
    const provider = configured[0] ?? claudeCVProvider;
    const cvData = await provider.generate(qaPairs, language, outputLanguage);
    return { cvData, model: provider.name, scores: [] };
  }

  // Multi-model: generate with every configured model in parallel.
  const results = await Promise.allSettled(
    configured.map((p) => p.generate(qaPairs, language, outputLanguage)),
  );

  const candidates: { provider: CVModelProvider; cv: CVData }[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      candidates.push({ provider: configured[i], cv: r.value });
    } else {
      logger.warn("cv model failed", { model: configured[i].name, err: r.reason });
    }
  });

  if (candidates.length === 0) {
    // Everything failed — surface the first error (route handles it).
    const firstReject = results.find((r) => r.status === "rejected");
    throw firstReject && firstReject.status === "rejected"
      ? firstReject.reason
      : new Error("All CV models failed");
  }

  // Blind-score the candidates.
  const judged = await scoreCVs(qaPairs, candidates.map((c) => c.cv));

  // Pick the highest score. Ties (and an all-zero judge failure) prefer the
  // earliest provider — Claude — since PROVIDERS is in preference order.
  let bestIdx = 0;
  for (let i = 1; i < candidates.length; i++) {
    if ((judged[i] ?? 0) > (judged[bestIdx] ?? 0)) bestIdx = i;
  }

  const scores: ModelScore[] = candidates.map((c, i) => ({
    model: c.provider.name,
    score: judged[i] ?? 0,
    won: i === bestIdx,
  }));

  logger.info("cv multi-model pick", {
    winner: candidates[bestIdx].provider.name,
    scores: scores.map((s) => `${s.model}:${s.score}`),
  });

  return {
    cvData: candidates[bestIdx].cv,
    model: candidates[bestIdx].provider.name,
    scores,
  };
}
