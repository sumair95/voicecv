/**
 * Tiny structured logger.
 *
 * - Emits JSON in production for ingestion by Vercel / Datadog / Sentry.
 * - Pretty-prints in development.
 * - Always carries a `context` object so call-sites can include the
 *   request id, user id, cv id, etc.
 *
 * Adopt incrementally — replacing `console.error("foo", err)` with
 * `logger.error("foo", { err })` gets you structured fields immediately.
 */

type Level = "debug" | "info" | "warn" | "error";

type Context = Record<string, unknown> | undefined;

interface LogPayload {
  level: Level;
  msg: string;
  time: string;
  ctx?: Record<string, unknown>;
}

const isProd = process.env.NODE_ENV === "production";

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { value: String(err) };
}

function normaliseCtx(ctx?: Context): Record<string, unknown> | undefined {
  if (!ctx) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (v instanceof Error || (v && typeof v === "object" && "stack" in v)) {
      out[k] = serializeError(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level: Level, msg: string, ctx?: Context) {
  const payload: LogPayload = {
    level,
    msg,
    time: new Date().toISOString(),
    ctx: normaliseCtx(ctx),
  };
  if (isProd) {
    // Structured single-line JSON for log shippers.
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](JSON.stringify(payload));
  } else {
    // Human-readable line for local dev.
    const tag = `[${payload.time.split("T")[1].slice(0, 8)}] ${level.toUpperCase()}`;
    if (payload.ctx) {
      // eslint-disable-next-line no-console
      console[level === "debug" ? "log" : level](tag, msg, payload.ctx);
    } else {
      // eslint-disable-next-line no-console
      console[level === "debug" ? "log" : level](tag, msg);
    }
  }
}

export const logger = {
  debug: (msg: string, ctx?: Context) => emit("debug", msg, ctx),
  info: (msg: string, ctx?: Context) => emit("info", msg, ctx),
  warn: (msg: string, ctx?: Context) => emit("warn", msg, ctx),
  error: (msg: string, ctx?: Context) => emit("error", msg, ctx),
};

/**
 * Generate a short request id (8 chars). Cheap, collision-tolerant for
 * correlation in a single request span.
 */
export function newRequestId(): string {
  return Math.random().toString(36).slice(2, 10);
}
