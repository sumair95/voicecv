/**
 * Convert the user's uploaded photo into a professional (white-background,
 * cropped) headshot via remove.bg, store it, and mark it as the CV's photo.
 *
 * Billing: the "professional photo" is a paid add-on. The paywall (Stripe pack
 * + credit) is the final wiring step — for now the conversion runs for
 * authenticated users (beta) and the UI shows the price as a placeholder.
 */

import { getAuthContext } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, serverError, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { isCompAccount } from "@/lib/premium/access";
import { isPhotoEnhanceConfigured, toProfessionalPhoto } from "@/lib/photo/enhance";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle("photo-convert", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  if (!isPhotoEnhanceConfigured()) {
    return NextResponse.json(
      { error: "Professional photo isn't available yet." },
      { status: 501 },
    );
  }

  const rate = take(`photo:${user.id}`, LIMITS.photoConvert);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many conversions. Try again shortly." },
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

  // Paid add-on: require a formal-photo credit (comped accounts skip the charge).
  // The credit is consumed only AFTER a successful conversion, so a remove.bg
  // failure never burns it.
  const comped = await isCompAccount(supabase);
  if (!comped && ((prof?.formal_photo_credits as number | undefined) ?? 0) < 1) {
    return paymentRequired("Professional photo is a paid add-on");
  }

  let bytes: Buffer;
  try {
    bytes = await toProfessionalPhoto(src);
  } catch (err) {
    log.warn("photo conversion failed", { err });
    return serverError(err instanceof Error ? err.message : "Photo conversion failed");
  }

  const path = `${user.id}/formal-${Date.now()}.jpg`;
  const { error: upErr } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
  if (upErr) {
    log.warn("converted photo upload failed", { err: upErr });
    return serverError("Couldn't save the converted photo");
  }
  const { data: pub } = admin.storage.from("avatars").getPublicUrl(path);
  const formalUrl = pub.publicUrl;

  await admin
    .from("profiles")
    .update({ photo_formal_url: formalUrl, photo_choice: "formal" })
    .eq("id", user.id);

  // Conversion succeeded — spend the credit now (comped users don't pay).
  if (!comped) await supabase.rpc("consume_formal_photo_credit");

  log.info("photo converted", { userId: user.id, comped });
  return ok({ formalUrl });
});
