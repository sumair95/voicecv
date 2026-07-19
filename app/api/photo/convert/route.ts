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
import { isGeminiConfigured, toSuitedPhoto } from "@/lib/photo/gemini";
import { classifyPhotoStyle } from "@/lib/photo/classify";
import { migrateCvData } from "@/lib/cv/migrate";
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

  // Choose the treatment from the user's most recent CV role: office/professional
  // → generative suited headshot (Gemini); manual/casual → clean white background
  // (remove.bg), so the photo stays authentic to the person's line of work.
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
  const useGemini = (await classifyPhotoStyle(role)) === "suit" && isGeminiConfigured();

  let bytes: Buffer;
  let appliedStyle: "suit" | "clean" = useGemini ? "suit" : "clean";
  try {
    bytes = useGemini ? await toSuitedPhoto(src) : await toProfessionalPhoto(src);
  } catch (err) {
    // If the generative path fails, fall back to the clean conversion so the
    // user still gets a result (and their credit buys something real).
    if (useGemini) {
      log.warn("gemini photo failed; falling back to clean", { err });
      try {
        bytes = await toProfessionalPhoto(src);
        appliedStyle = "clean";
      } catch (err2) {
        log.warn("photo conversion failed", { err: err2 });
        return serverError(err2 instanceof Error ? err2.message : "Photo conversion failed");
      }
    } else {
      log.warn("photo conversion failed", { err });
      return serverError(err instanceof Error ? err.message : "Photo conversion failed");
    }
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

  log.info("photo converted", { userId: user.id, comped, style: appliedStyle });
  return ok({ formalUrl, style: appliedStyle });
});
