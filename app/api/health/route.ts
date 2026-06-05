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

  return ok({
    status: dbOk ? "ok" : "degraded",
    db: { ok: dbOk, latencyMs: dbLatencyMs },
    uptimeMs: process.uptime() * 1000,
    totalMs: Date.now() - startedAt,
  });
});
