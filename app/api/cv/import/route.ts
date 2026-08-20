/**
 * Import an existing CV file → a new CV row, ready to edit.
 *
 * Counts against the same lifetime free-CV allowance as a voice-recorded CV
 * (`FREE_CV_LIMIT + cv_credits`, tracked by `cvs_created`): it produces exactly
 * the same artefact, so it costs the same. The limit is checked BEFORE the
 * model call so an over-limit user never burns tokens.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import {
  badRequest,
  ok,
  paymentRequired,
  serverError,
  unauthorized,
} from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { FREE_CV_LIMIT } from "@/lib/premium";
import { isCompAccount } from "@/lib/premium/access";
import { parseCvFile } from "@/lib/cv/import";
import { logEvent } from "@/lib/analytics-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/** A CV past this is not a CV. Also bounds what we'll tokenize. */
const MAX_BYTES = 6 * 1024 * 1024;

const TEXT_TYPES = ["text/plain", "text/markdown"];

export const POST = handle("cv-import", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`cvimport:${user.id}`, LIMITS.cvImport);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("file required");
  if (file.size === 0) return badRequest("That file is empty.");
  if (file.size > MAX_BYTES) return badRequest("That file is too large (max 6 MB).");

  const name = file.name ?? "";
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(name);
  const isText = TEXT_TYPES.includes(file.type) || /\.(txt|md|markdown)$/i.test(name);
  if (!isPdf && !isText) {
    return badRequest(
      "Upload a PDF or a .txt file. If your CV is a Word document, export it as PDF first.",
    );
  }

  // Free-CV limit — checked before the (paid) model call. Comped accounts and
  // free mode bypass it, exactly as in generate-cv.
  const comped = await isCompAccount(supabase);
  if (!comped) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("cvs_created, cv_credits")
      .eq("id", user.id)
      .single();
    const allowance = FREE_CV_LIMIT + (prof?.cv_credits ?? 0);
    if ((prof?.cvs_created ?? 0) >= allowance) {
      return paymentRequired("Free CV limit reached");
    }
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  let parsed;
  try {
    parsed = isPdf
      ? await parseCvFile({ kind: "pdf", base64: bytes.toString("base64") })
      : await parseCvFile({ kind: "text", text: bytes.toString("utf8") });
  } catch (err) {
    log.warn("cv import parse failed", { err, userId: user.id });
    return serverError("Couldn't read that CV — please try another file.");
  }

  if (!parsed.usable) {
    return badRequest(
      "That file doesn't look like a CV — we couldn't find a name, any jobs, education or skills in it.",
    );
  }

  const title = parsed.cv.personal.full_name || name.replace(/\.[^.]+$/, "") || "My CV";
  const { data: created, error } = await supabase
    .from("cvs")
    .insert({
      user_id: user.id,
      status: "ready",
      title,
      cv_data: parsed.cv,
      // The import IS the machine's original output for this CV, so it is the
      // right baseline for the edit-diff learning loop.
      generated_cv_data: parsed.cv,
      generated_by: "import",
      language: parsed.language,
    })
    .select("id")
    .single();
  if (error) throw error;

  const cvId = created!.id as string;
  // Count it against the lifetime allowance (best-effort, as in generate-cv).
  await supabase.rpc("increment_cvs_created");

  await logEvent(supabase, user.id, "cv_imported", {
    cvId,
    source: isPdf ? "pdf" : "text",
    language: parsed.language,
    experience: parsed.cv.experience.length,
  });
  log.info("cv imported", { userId: user.id, cvId, isPdf });

  return ok({ cvId });
});
