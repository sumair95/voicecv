/**
 * Public impact stats for the landing page — real, authentic counts of what the
 * platform has produced. Cached in memory for 60s so the DB isn't hit on every
 * page load. Also returns free_mode so the UI can hide pricing during testing.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { ok } from "@/lib/api/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Stats {
  cvs: number;
  coverLetters: number;
  jobs: number;
  freeMode: boolean;
}

let cache: Stats | null = null;
let cachedAt = 0;
const TTL_MS = 60_000;

export const GET = handle("stats", async () => {
  const now = Date.now();
  if (cache && now - cachedAt < TTL_MS) return ok(cache);

  const admin = createAdminClient();
  const [cvs, letters, jobs, settings] = await Promise.all([
    admin.from("cvs").select("*", { count: "exact", head: true }),
    admin
      .from("cvs")
      .select("*", { count: "exact", head: true })
      .not("cover_letter", "is", null),
    admin.from("job_applications").select("*", { count: "exact", head: true }),
    admin.from("app_settings").select("free_mode").eq("id", 1).single(),
  ]);

  cache = {
    cvs: cvs.count ?? 0,
    coverLetters: letters.count ?? 0,
    jobs: jobs.count ?? 0,
    freeMode: (settings.data?.free_mode as boolean | undefined) ?? false,
  };
  cachedAt = now;
  return ok(cache);
});
