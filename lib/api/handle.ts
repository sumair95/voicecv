/**
 * Wrap a route handler with structured logging + uniform error mapping.
 *
 * Usage:
 *   export const POST = handle("transcribe", async ({ req, log }) => {
 *     ...
 *     return ok({ transcript });
 *   });
 *
 * The wrapper:
 * - Generates a short request id and attaches it to the log context.
 * - Catches thrown errors, logs them with stack, and returns a 500 JSON.
 * - Returns the handler's response untouched on success.
 */

import { NextResponse } from "next/server";
import { logger, newRequestId } from "@/lib/log";

interface HandlerCtx {
  req: Request;
  log: typeof logger;
  reqId: string;
}

type Handler = (ctx: HandlerCtx) => Promise<NextResponse> | NextResponse;

export function handle(route: string, fn: Handler) {
  return async (req: Request) => {
    const reqId = newRequestId();
    const log = {
      debug: (m: string, c?: Record<string, unknown>) =>
        logger.debug(m, { route, reqId, ...c }),
      info: (m: string, c?: Record<string, unknown>) =>
        logger.info(m, { route, reqId, ...c }),
      warn: (m: string, c?: Record<string, unknown>) =>
        logger.warn(m, { route, reqId, ...c }),
      error: (m: string, c?: Record<string, unknown>) =>
        logger.error(m, { route, reqId, ...c }),
    };
    try {
      return await fn({ req, log, reqId });
    } catch (err) {
      // Log the full detail server-side, but NEVER return raw err.message to the
      // client (L4): upstream provider bodies and Postgres errors leak schema +
      // internals. The client gets a generic message + the reqId to quote in a
      // support request, which we can correlate to the logged stack.
      log.error("handler threw", { err });
      return NextResponse.json(
        { error: "Something went wrong. Please try again.", reqId },
        { status: 500 },
      );
    }
  };
}
