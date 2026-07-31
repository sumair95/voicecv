/**
 * Rate limiter (H2).
 *
 * Per-user, per-route, time-windowed counter that bounds paid AI spend
 * (Whisper, Claude, GPT-4o, Gemini, remove.bg) for a single misbehaving or
 * compromised account.
 *
 * Primary path: an atomic Postgres counter (`rate_limit_take` RPC, migration
 * 024) shared across every server instance — cluster-safe. If that RPC is
 * unavailable (e.g. the migration hasn't been run yet), it FALLS BACK to the
 * per-process in-memory counter below, so the app never breaks; it just
 * temporarily loses cross-instance accuracy.
 */

import { logger } from "@/lib/log";
import { createAdminClient } from "@/lib/supabase/server";

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

/** In-memory fallback — per-process, used only when the DB RPC is unavailable. */
function takeInMemory(key: string, opts: LimitOpts): RateResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    const fresh: Window = { count: 1, resetAt: now + opts.windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: opts.max - 1, resetAt: fresh.resetAt };
  }
  if (existing.count >= opts.max) {
    logger.warn("rate limit hit", { key, count: existing.count });
    return { ok: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { ok: true, remaining: opts.max - existing.count, resetAt: existing.resetAt };
}

interface RateRow {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

/**
 * Take one token for `key`. Cluster-safe via Postgres; falls back to the
 * in-memory counter if the DB RPC errors, so rate limiting can never take the
 * API down. Async — callers must `await`.
 */
export async function take(key: string, opts: LimitOpts): Promise<RateResult> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rate_limit_take", {
      p_key: key,
      p_max: opts.max,
      p_window_ms: opts.windowMs,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as RateRow | undefined;
    if (!row) throw new Error("rate_limit_take returned no row");
    if (!row.allowed) logger.warn("rate limit hit", { key });
    return {
      ok: row.allowed,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at).getTime(),
    };
  } catch (err) {
    logger.warn("rate limiter fell back to in-memory", { err, key });
    return takeInMemory(key, opts);
  }
}

// Sensible defaults for our routes — tune later if needed.
export const LIMITS = {
  transcribe: { windowMs: 60_000, max: 20 }, // 20 audio chunks / min
  generateCv: { windowMs: 60_000, max: 4 }, // 4 full CV generations / min
  exportPdf: { windowMs: 60_000, max: 10 },
  jobSearch: { windowMs: 60_000, max: 8 }, // 8 job searches / min (each hits JSearch + Claude)
  photoConvert: { windowMs: 60_000, max: 5 }, // 5 photo conversions / min (each spends a remove.bg credit)
  jobImprove: { windowMs: 60_000, max: 6 }, // 6 "improve match" analyses / min (each hits Claude)
  jobTailor: { windowMs: 60_000, max: 4 }, // 4 CV tailors / min (each hits Claude + spends a credit)
} as const;
