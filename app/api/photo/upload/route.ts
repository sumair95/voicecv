/**
 * Photo upload. Uses the service-role client for the storage write (the codebase
 * pattern for privileged storage ops) so it isn't blocked by browser-side
 * storage RLS. Auth still identifies the user and scopes the path/row.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api/respond";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8_000_000;

export const POST = handle("photo-upload", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("No file provided");
  if (!file.type.startsWith("image/")) return badRequest("File must be an image");
  if (file.size > MAX_BYTES) return badRequest("Image too large (max 8MB)");

  const ext =
    (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const path = `${user.id}/avatar-${Date.now()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const admin = createServiceClient();
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: true });
  if (upErr) {
    log.warn("avatar upload failed", { err: upErr });
    return serverError(upErr.message);
  }

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const photoUrl = pub.publicUrl;

  // New upload invalidates the old professional version (made from the old photo).
  await admin
    .from("profiles")
    .update({ photo_url: photoUrl, photo_formal_url: null, photo_choice: "original" })
    .eq("id", user.id);

  log.info("avatar uploaded", { userId: user.id });
  return ok({ photoUrl });
});
