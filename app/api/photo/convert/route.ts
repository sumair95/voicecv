/**
 * Process the user's uploaded photo. Two modes:
 *   - "removebg" (FREE): remove.bg → clean white-background headshot. No credit.
 *   - "enhance"  (PREMIUM $5): generative Gemini edit — a suited headshot for
 *     office/professional roles, or a natural retouch for manual/casual roles
 *     (role read from the user's most recent CV). Gated by a formal-photo credit
 *     (comped accounts skip the charge); credit consumed only on success.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, serverError, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { isCompAccount } from "@/lib/premium/access";
import { isPhotoEnhanceConfigured, toProfessionalPhoto } from "@/lib/photo/enhance";
import { isGeminiConfigured, toEnhancedPhoto } from "@/lib/photo/gemini";
import { classifyPhotoStyle } from "@/lib/photo/classify";
import { isAllowedImageUrl } from "@/lib/net/safe-image";
import { sniffImageType, extFor } from "@/lib/net/image-bytes";
import { pruneAvatars } from "@/lib/photo/storage";
import { migrateCvData } from "@/lib/cv/migrate";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle("photo-convert", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { mode?: "removebg" | "enhance" };
  const mode: "removebg" | "enhance" = body.mode === "enhance" ? "enhance" : "removebg";

  const rate = await take(`photo:${user.id}`, LIMITS.photoConvert);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  // True service-role client for the privileged storage write (bypasses RLS).
  const admin = createAdminClient();
  const { data: prof } = await admin
    .from("profiles")
    .select("photo_url, formal_photo_credits")
    .eq("id", user.id)
    .single();
  const src = (prof?.photo_url as string | undefined) ?? undefined;
  if (!src) return badRequest("Upload a photo first");
  // photo_url is written only by /api/photo/upload (service-role) and is no
  // longer client-writable (migration 023), but both downstream paths fetch it
  // by URL — so validate here too rather than relying on that invariant holding.
  if (!isAllowedImageUrl(src)) {
    log.warn("stored photo_url is not on our storage host", { userId: user.id });
    return badRequest("Please re-upload your photo.");
  }

  let bytes: Buffer;
  let appliedStyle: "clean" | "suit" | "enhance" = "clean";
  let comped = false;

  if (mode === "removebg") {
    // FREE — background removal only.
    if (!isPhotoEnhanceConfigured()) {
      return NextResponse.json({ error: "Background removal isn't available yet." }, { status: 501 });
    }
    try {
      bytes = await toProfessionalPhoto(src);
    } catch (err) {
      log.warn("background removal failed", { err });
      return serverError("Background removal failed. Please try again.");
    }
    appliedStyle = "clean";
  } else {
    // PREMIUM — generative enhance / suit via Gemini.
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "Photo enhancement isn't available yet." }, { status: 501 });
    }
    // Require a formal-photo credit (comped accounts skip the charge). Consumed
    // only AFTER success below, so a Gemini failure never burns it.
    comped = await isCompAccount(supabase);
    if (!comped && ((prof?.formal_photo_credits as number | undefined) ?? 0) < 1) {
      return paymentRequired("Photo enhancement is a Premium feature");
    }

    // Role (from the most recent CV) decides the generative style: office/pro →
    // suit; manual/casual → natural retouch without a suit (stays authentic).
    const { data: cvRow } = await admin
      .from("cvs")
      .select("cv_data")
      .eq("user_id", user.id)
      .eq("status", "ready")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    let role = "";
    if (cvRow?.cv_data) {
      const cd = migrateCvData(cvRow.cv_data);
      role = cd.personal.job_title?.trim() || cd.experience.find((e) => e.role?.trim())?.role?.trim() || "";
    }
    const variant = (await classifyPhotoStyle(role)) === "suit" ? "suit" : "enhance";
    try {
      bytes = await toEnhancedPhoto(src, variant);
    } catch (err) {
      // Don't charge on failure (credit is consumed only on success below).
      log.warn("gemini enhance failed", { err });
      return serverError("Photo enhancement failed. Please try again.");
    }
    appliedStyle = variant;
  }

  // The processed bytes come from a third party (remove.bg / Gemini), so sniff
  // them rather than assuming a format — and reject anything that isn't a real
  // raster image before it lands in the public bucket.
  const kind = sniffImageType(bytes);
  if (!kind) {
    log.warn("processed photo is not a valid image", { userId: user.id, mode });
    return serverError("The processed photo was invalid — please try again.");
  }
  const path = `${user.id}/formal-${Date.now()}.${extFor(kind)}`;
  const contentType = kind;
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType, upsert: true });
  if (upErr) {
    log.warn("processed photo upload failed", { err: upErr });
    return serverError("Couldn't save the photo");
  }
  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const formalUrl = pub.publicUrl;

  await admin
    .from("profiles")
    .update({ photo_formal_url: formalUrl, photo_choice: "formal" })
    .eq("id", user.id);

  // Prune old objects, keeping the current original + the new formal (H4).
  const marker = "/object/public/avatars/";
  const origPath = src.includes(marker)
    ? decodeURIComponent(src.slice(src.indexOf(marker) + marker.length).split("?")[0])
    : "";
  await pruneAvatars(admin, user.id, [path, origPath].filter(Boolean));

  // Spend a credit only for the premium enhance path (comped users don't pay).
  if (mode === "enhance" && !comped) await supabase.rpc("consume_formal_photo_credit");

  log.info("photo processed", { userId: user.id, mode, style: appliedStyle, comped });
  return ok({ formalUrl, style: appliedStyle, mode });
});
