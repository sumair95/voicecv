/**
 * Avatar storage: retention + private-bucket access (H4).
 *
 * Retention — photos previously accumulated forever: each re-upload/convert
 * wrote a new timestamped object and orphaned the old one, and nothing was
 * deleted when a user removed a photo or deleted their account. For face photos
 * of a migrant-worker user base that's a real data-retention/GDPR problem.
 * `pruneAvatars` fixes that.
 *
 * Privacy — the bucket used to be public, so a headshot URL was a permanent
 * unauthenticated handle on that user's face, guessable-adjacent and immune to
 * "remove photo" (the URL kept working until the object was deleted, and any
 * copy of it forever). Migration 027 flips the bucket private; reads now go
 * through short-lived signed URLs minted per request for the owner only.
 *
 * The awkward part is that a photo reference reaches us in three shapes:
 *   - a bare storage path        "<uid>/avatar-123.jpg"   (what we write now)
 *   - a legacy public URL        ".../object/public/avatars/<uid>/avatar-1.jpg"
 *   - a stale signed URL         ".../object/sign/avatars/<uid>/avatar-1.jpg?token=…"
 *
 * The last two exist because `cvs.cv_data.personal.photo_url` is persisted by
 * the browser on every auto-save, so whatever was rendered gets written back.
 * `avatarPath()` accepts all three and always yields the canonical path, which
 * makes the system self-healing: a stale signed URL that lands in the DB still
 * resolves, and is simply re-signed on the next read.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/log";

/** How long a minted avatar URL stays valid. Long enough to render a page and
 *  export a PDF, short enough that a leaked URL is not a lasting handle. */
export const AVATAR_URL_TTL_SECONDS = 60 * 60;

/**
 * Normalize any avatar reference to its storage path, scoped to one user.
 *
 * Returns null unless the resolved path sits under `<userId>/`, so a value
 * lifted from someone else's profile (or hand-written into cv_data by the
 * browser) can never be turned into a signed URL for another user's photo.
 */
export function avatarPath(
  value: string | null | undefined,
  userId: string,
): string | null {
  if (!value) return null;

  let path: string | null = null;

  if (value.includes("://")) {
    // A URL — pull the object path out of whichever storage form it uses.
    // Bail on anything that isn't our bucket rather than guessing.
    for (const marker of ["/object/public/avatars/", "/object/sign/avatars/"]) {
      const i = value.indexOf(marker);
      if (i !== -1) {
        path = value.slice(i + marker.length).split("?")[0];
        break;
      }
    }
    if (path === null) return null;
    try {
      path = decodeURIComponent(path);
    } catch {
      return null;
    }
  } else {
    // Already a bare path. Reject absolute/relative escapes outright.
    path = value.split("?")[0];
  }

  if (!path || path.includes("..") || path.startsWith("/")) return null;
  return path.startsWith(`${userId}/`) ? path : null;
}

/**
 * Mint a short-lived read URL for one of this user's avatar objects.
 * Returns null on any failure — callers render without a photo rather than
 * surfacing a storage error into an otherwise-fine page.
 */
export async function signAvatarUrl(
  admin: SupabaseClient,
  value: string | null | undefined,
  userId: string,
): Promise<string | null> {
  const path = avatarPath(value, userId);
  if (!path) return null;
  try {
    const { data, error } = await admin.storage
      .from("avatars")
      .createSignedUrl(path, AVATAR_URL_TTL_SECONDS);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch (err) {
    logger.warn("signAvatarUrl failed", { err, userId });
    return null;
  }
}

/**
 * Read an avatar's bytes straight out of storage with the service-role client.
 *
 * Server-side consumers (PDF export, the Gemini enhancer) used to fetch the
 * public URL over HTTP behind an SSRF allowlist. Going through storage directly
 * is strictly better: there is no outbound request to guard, and it keeps
 * working now that the bucket is private.
 */
export async function downloadAvatar(
  admin: SupabaseClient,
  value: string | null | undefined,
  userId: string,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const path = avatarPath(value, userId);
  if (!path) return null;
  try {
    const { data, error } = await admin.storage.from("avatars").download(path);
    if (error || !data) return null;
    const bytes = Buffer.from(await data.arrayBuffer());
    if (bytes.length === 0 || bytes.length > 8_000_000) return null;
    return { bytes, contentType: data.type || "image/jpeg" };
  } catch (err) {
    logger.warn("downloadAvatar failed", { err, userId });
    return null;
  }
}

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
