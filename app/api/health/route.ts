import { handle } from "@/lib/api/handle";
import { ok } from "@/lib/api/respond";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Tiny health probe. Returns 200 + version + DB ping status.
 * Used by load balancers / uptime monitors.
 */
export const GET = handle("health", async () => {
  const startedAt = Date.now();

  // Cheap Supabase ping — count(*) on the questions table (publicly readable).
  let dbOk = false;
  let dbLatencyMs: number | null = null;
  try {
    const t0 = Date.now();
    const supabase = createClient();
    const { error } = await supabase
      .from("questions")
      .select("id", { count: "exact", head: true });
    dbLatencyMs = Date.now() - t0;
    dbOk = !error;
  } catch {
    dbOk = false;
  }

  // AI config signal (M8). The whole agentic layer fails SILENTLY on a wrong
  // model id or a revoked key (the judge returns zeros, the photo classifier
  // defaults to "clean"), so surface whether the core keys are even present.
  // Cheap: no external call. A missing primary key flips overall status so an
  // uptime monitor notices. (Presence ≠ validity — a deep ping would cost
  // tokens; add one behind a query flag if needed.)
  const ai = {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    openai: Boolean(process.env.OPENAI_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    removebg: Boolean(process.env.REMOVEBG_API_KEY),
  };
  const aiDegraded = !ai.anthropic || !ai.openai;

  return ok({
    status: dbOk && !aiDegraded ? "ok" : "degraded",
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    ai,
    aiDegraded,
    uptimeMs: process.uptime() * 1000,
    totalMs: Date.now() - startedAt,
  });
});
