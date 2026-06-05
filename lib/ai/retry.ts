/**
 * Exponential backoff with jitter. Cheap protection against transient
 * 429s / 503s from Anthropic + OpenAI + Supabase.
 *
 * Usage:
 *   const result = await withRetry(() => anthropic.messages.create(...));
 *
 * - Default 3 tries.
 * - Default base delay 300ms, doubling each attempt.
 * - +/- 25% jitter to avoid thundering herd if many users retry in sync.
 * - Aborts on non-retriable errors (4xx other than 408/425/429).
 */

interface RetryOpts {
  attempts?: number;
  baseDelayMs?: number;
  shouldRetry?: (err: unknown, attempt: number) => boolean;
  onRetry?: (err: unknown, attempt: number) => void;
}

function isRetriableHttpError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const status = (err as Error & { status?: number }).status;
  if (typeof status !== "number") return true; // network-level → retry
  if (status === 408 || status === 425 || status === 429) return true;
  if (status >= 500 && status < 600) return true;
  return false;
}

function jitter(ms: number): number {
  // +/- 25%
  return Math.round(ms * (0.75 + Math.random() * 0.5));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOpts = {},
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const baseDelayMs = opts.baseDelayMs ?? 300;
  const shouldRetry = opts.shouldRetry ?? ((e) => isRetriableHttpError(e));

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isLast = i === attempts - 1;
      if (isLast || !shouldRetry(err, i)) throw err;
      opts.onRetry?.(err, i);
      await sleep(jitter(baseDelayMs * 2 ** i));
    }
  }
  throw lastErr;
}
