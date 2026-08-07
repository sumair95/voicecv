/**
 * Mint short-lived read URLs for the caller's own avatar objects (H4).
 *
 * The `avatars` bucket is private as of migration 027, so `profiles.photo_url` /
 * `photo_formal_url` now hold storage paths rather than renderable URLs. Any
 * client that needs to display a headshot asks here and gets URLs valid for
 * `AVATAR_URL_TTL_SECONDS`.
 *
 * Scoping is implicit and total: paths come from the caller's own profile row
 * and `signAvatarUrl` refuses anything outside `<uid>/`. There is no request
 * parameter naming an object, so there is nothing for a caller to tamper with.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";
import { signAvatarUrl, AVATAR_URL_TTL_SECONDS } from "@/lib/photo/storage";

export const runtime = "nodejs";
// Per-user and auth-dependent — never prerender it (the convention for GET
// routes here; without it the build tries to render this statically).
export const dynamic = "force-dynamic";

export const GET = handle("photo-signed", async ({ req }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("photo_url, photo_formal_url, photo_choice")
    .eq("id", user.id)
    .single();

  const [photoUrl, formalUrl] = await Promise.all([
    signAvatarUrl(admin, (prof?.photo_url as string) ?? null, user.id),
    signAvatarUrl(admin, (prof?.photo_formal_url as string) ?? null, user.id),
  ]);

  return ok({
    photoUrl,
    formalUrl,
    choice: prof?.photo_choice === "formal" ? "formal" : "original",
    expiresInSeconds: AVATAR_URL_TTL_SECONDS,
  });
});
