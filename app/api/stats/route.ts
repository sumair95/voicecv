/**
 * Public impact stats for the landing page — real, authentic counts of what the
 * platform has produced. The (heavier) counts are cached for 60s; free_mode is
 * read FRESH on every request so the payment toggle takes effect immediately.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { ok } from "@/lib/api/respond";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Counts {
  cvs: number;
  coverLetters: number;
  jobs: number;
}

let countsCache: Counts | null = null;
let countsAt = 0;
const TTL_MS = 60_000;

// Baselines account for real usage before counting was wired in (Sumair's own
// prior CVs/cover letters). Displayed as a floor — counters still grow.
const CV_BASELINE = 5;
const LETTER_BASELINE = 3;

export const GET = handle("stats", async () => {
  const admin = createAdminClient();

  // free_mode: read fresh every request (single cheap row) + resilient, so the
  // /admin payment toggle reflects instantly and a missing column can't 500.
  let freeMode = false;
  try {
    const { data } = await admin.from("app_settings").select("free_mode").eq("id", 1).single();
    freeMode = Boolean(data?.free_mode);
  } catch {
    freeMode = false;
  }

  const now = Date.now();
  if (!countsCache || now - countsAt >= TTL_MS) {
    const [cvs, letters, jobs] = await Promise.all([
      admin.from("cvs").select("*", { count: "exact", head: true }),
      admin
        .from("cvs")
        .select("*", { count: "exact", head: true })
        .not("cover_letter", "is", null),
      admin.from("job_applications").select("*", { count: "exact", head: true }),
    ]);
    countsCache = {
      cvs: Math.max(cvs.count ?? 0, CV_BASELINE),
      coverLetters: Math.max(letters.count ?? 0, LETTER_BASELINE),
      jobs: jobs.count ?? 0,
    };
    countsAt = now;
  }

  return ok({ ...countsCache, freeMode });
});
