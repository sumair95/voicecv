/**
 * Photo upload. Uses the service-role client for the storage write (the codebase
 * pattern for privileged storage ops) so it isn't blocked by browser-side
 * storage RLS. Auth still identifies the user and scopes the path/row.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api/respond";
import { sniffImageType, extFor } from "@/lib/net/image-bytes";
import { pruneAvatars } from "@/lib/photo/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 8_000_000;

export const POST = handle("photo-upload", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return badRequest("No file provided");
  if (file.size > MAX_BYTES) return badRequest("Image too large (max 8MB)");

  // Trust the BYTES, not file.type/file.name (both client-controlled). This
  // rejects an SVG-with-<script> mislabelled as image/jpeg — which, in a public
  // bucket, would otherwise be a stored XSS page served from our storage origin.
  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniffImageType(bytes);
  if (!kind) {
    log.warn("photo upload rejected — not a JPEG/PNG/WEBP", {
      userId: user.id,
      claimedType: file.type,
    });
    return badRequest("File must be a JPEG, PNG, or WEBP image");
  }

  // Extension + stored Content-Type come from the sniff, never the upload.
  const path = `${user.id}/avatar-${Date.now()}.${extFor(kind)}`;

  const admin = createAdminClient();
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: kind, upsert: true });
  if (upErr) {
    log.warn("avatar upload failed", { err: upErr });
    return serverError("Couldn't save the photo. Please try again.");
  }

  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const photoUrl = pub.publicUrl;

  // New upload invalidates the old professional version (made from the old photo).
  await admin
    .from("profiles")
    .update({ photo_url: photoUrl, photo_formal_url: null, photo_choice: "original" })
    .eq("id", user.id);

  // Delete the previous avatar/formal objects so photos don't pile up forever
  // (H4 retention). Keep only the file we just wrote.
  await pruneAvatars(admin, user.id, [path]);

  log.info("avatar uploaded", { userId: user.id });
  return ok({ photoUrl });
});
