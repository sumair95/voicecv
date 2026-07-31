/**
 * Avatar storage housekeeping (H4 — retention).
 *
 * Photos previously accumulated forever: each re-upload/convert wrote a new
 * timestamped object and orphaned the old one, and nothing was deleted when a
 * user removed a photo or deleted their account. For face photos of a migrant-
 * worker user base that's a real data-retention/GDPR problem.
 *
 * `pruneAvatars` deletes every object in the user's own avatar folder except the
 * ones passed in `keep`, so at most the current original + formal remain.
 * Best-effort: a storage error is logged, never thrown, so it can't fail the
 * request that triggered it.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/log";

/**
 * @param admin  service-role client
 * @param userId owner — also the storage folder name
 * @param keep   relative object paths to preserve (e.g. "uid/avatar-123.jpg")
 */
export async function pruneAvatars(
  admin: SupabaseClient,
  userId: string,
  keep: string[],
): Promise<void> {
  try {
    const keepSet = new Set(keep);
    const { data, error } = await admin.storage.from("avatars").list(userId, {
      limit: 100,
    });
    if (error || !data) return;
    const toRemove = data
      .map((o) => `${userId}/${o.name}`)
      .filter((p) => !keepSet.has(p));
    if (toRemove.length > 0) {
      await admin.storage.from("avatars").remove(toRemove);
      logger.info("pruned old avatar objects", { userId, removed: toRemove.length });
    }
  } catch (err) {
    logger.warn("pruneAvatars failed", { err, userId });
  }
}
