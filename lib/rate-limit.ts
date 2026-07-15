/**
 * Minimal in-memory rate limiter.
 *
 * Per-user, per-route, time-windowed counter. Keeps Whisper + Claude
 * costs bounded for a single misbehaving (or compromised) account.
 *
 * NOT cluster-safe — when we deploy multiple Railway/Vercel instances
 * we should swap the in-memory Map for Upstash Redis or a Postgres
 * counter. The API is intentionally identical (`take(key)`) so the swap
 * is one file.
 */

import { logger } from "@/lib/log";

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();

interface LimitOpts {
  /** Window size in ms. */
  windowMs: number;
  /** Max actions allowed per key in the window. */
  max: number;
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function take(key: string, opts: LimitOpts): RateResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh: Window = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: opts.max - 1, resetAt: fresh.resetAt };
  }
  if (existing.count >= opts.max) {
    logger.warn("rate limit hit", { key, count: existing.count });
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }
  existing.count += 1;
  return {
    ok: true,
    remaining: opts.max - existing.count,
    resetAt: existing.resetAt,
  };
}

// Sensible defaults for our routes — tune later if needed.
export const LIMITS = {
  transcribe: { windowMs: 60_000, max: 20 }, // 20 audio chunks / min
  generateCv: { windowMs: 60_000, max: 4 }, // 4 full CV generations / min
  exportPdf: { windowMs: 60_000, max: 10 },
  jobSearch: { windowMs: 60_000, max: 8 }, // 8 job searches / min (each hits JSearch + Claude)
  photoConvert: { windowMs: 60_000, max: 5 }, // 5 photo conversions / min (each spends a remove.bg credit)
  jobImprove: { windowMs: 60_000, max: 6 }, // 6 "improve match" analyses / min (each hits Claude)
} as const;
