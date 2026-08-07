/**
 * Clear the user's profile photo.
 *
 * This used to be a direct `supabase.from("profiles").update({ photo_url: null })`
 * from the browser, but `photo_url` / `photo_formal_url` are server-only columns
 * as of migration 023 (they name storage objects the client must not be able to
 * repoint), so the write moves here behind the service-role client.
 *
 * Also deletes the underlying storage objects — the old client-side version left
 * them in the bucket forever, which for face photos is a data-retention problem.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";
import { avatarPath } from "@/lib/photo/storage";

export const runtime = "nodejs";

export const POST = handle("photo-remove", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("photo_url, photo_formal_url")
    .eq("id", user.id)
    .single();

  await admin
    .from("profiles")
    .update({ photo_url: null, photo_formal_url: null, photo_choice: "original" })
    .eq("id", user.id);

  // Best-effort cleanup — the profile is already cleared, so a storage error
  // must not fail the request. `avatarPath` accepts a bare path (what we store
  // now) as well as a legacy public URL, and already refuses anything outside
  // this user's own folder.
  const paths = [
    avatarPath((prof?.photo_url as string) ?? null, user.id),
    avatarPath((prof?.photo_formal_url as string) ?? null, user.id),
  ].filter((p): p is string => Boolean(p));

  if (paths.length > 0) {
    const { error } = await admin.storage.from("avatars").remove(paths);
    if (error) log.warn("avatar storage cleanup failed", { err: error, paths });
  }

  log.info("photo removed", { userId: user.id, objects: paths.length });
  return ok({ removed: true });
});
