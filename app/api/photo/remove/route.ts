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
import { isAllowedImageUrl } from "@/lib/net/safe-image";

export const runtime = "nodejs";

/** "https://<host>/storage/v1/object/public/avatars/<uid>/x.jpg" → "<uid>/x.jpg" */
function storagePath(url: string | null): string | null {
  if (!url || !isAllowedImageUrl(url)) return null;
  const marker = "/object/public/avatars/";
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]) || null;
}

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
  // must not fail the request. Paths are re-derived from the stored URLs and
  // confirmed to sit under this user's own folder before deleting.
  const paths = [
    storagePath((prof?.photo_url as string) ?? null),
    storagePath((prof?.photo_formal_url as string) ?? null),
  ].filter((p): p is string => Boolean(p) && p!.startsWith(`${user.id}/`));

  if (paths.length > 0) {
    const { error } = await admin.storage.from("avatars").remove(paths);
    if (error) log.warn("avatar storage cleanup failed", { err: error, paths });
  }

  log.info("photo removed", { userId: user.id, objects: paths.length });
  return ok({ removed: true });
});
