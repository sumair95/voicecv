import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthContext } from "@/lib/api/auth";
import { CVDocument } from "@/lib/pdf-generator";
import { migrateCvData } from "@/lib/cv/migrate";
import { getTemplate, DEFAULT_TEMPLATE } from "@/lib/cv/templates";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, unauthorized, conflict, serverError } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { downloadAvatar } from "@/lib/photo/storage";
import { createAdminClient } from "@/lib/supabase/server";
import { logger } from "@/lib/log";
import type { CVRecord, Language, TemplateId } from "@/types/cv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Inline the CV photo as a data URI. Rendering from bytes (not a live URL)
// means a slow/broken image can never hang or crash the whole PDF — on any
// failure we return "" and the templates simply omit the photo.
//
// The value comes from cv_data, which the browser writes directly, so it is
// untrusted input. Since the bucket went private (H4) the normal path no longer
// makes an outbound request at all: the reference is resolved to a storage path
// scoped to this user and the bytes are read with the service-role client. That
// removes the SSRF sink rather than guarding it.
//
// A data URI is passed through (already inline bytes). Anything else — a URL
// pointing somewhere that isn't this user's own avatar folder — is dropped.
async function photoDataUri(value: string, userId: string): Promise<string> {
  if (value.startsWith("data:image/")) return value;

  const admin = createAdminClient();
  const file = await downloadAvatar(admin, value, userId);
  if (!file) {
    logger.warn("photo_url rejected — not this user's avatar object", {
      value: value.slice(0, 120),
      userId,
    });
    return "";
  }
  return `data:${file.contentType};base64,${file.bytes.toString("base64")}`;
}

export const POST = handle("export-pdf", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`pdf:${user.id}`, LIMITS.exportPdf);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many downloads. Try again in a minute." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  const { cvId } = (await req.json()) as { cvId: string };
  if (!cvId) return badRequest("cvId required");

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", cvId)
    .eq("user_id", user.id)
    .single();

  if (!cvRow) return notFound("CV not found");

  const cv = cvRow as CVRecord;
  if (!cv.cv_data) return conflict("CV is not ready");

  // Render the CV in the language it was written in (Italian → Italian,
  // everything else → English). Stored on the row at generation time;
  // older rows without the column fall back to English.
  const language: Language = cv.language ?? "en";

  let template = (cv.template ?? DEFAULT_TEMPLATE) as TemplateId;
  // Server-side entitlement check — a premium template only renders if this
  // CV has been unlocked (a premium-CV credit was spent). A tampered client
  // that saved a premium template without paying gets downgraded here.
  if (getTemplate(template).premium && !cv.premium_unlocked) {
    log.warn("template downgrade — not unlocked", {
      userId: user.id,
      cvId,
      requested: template,
    });
    template = DEFAULT_TEMPLATE;
  }

  const cvData = migrateCvData(cv.cv_data);
  // Inline the opt-in photo as bytes (safe render); drop it if it can't be fetched.
  if (cvData.personal.photo_url) {
    cvData.personal.photo_url = await photoDataUri(
      cvData.personal.photo_url,
      user.id,
    );
  }

  try {
    const buffer = await renderToBuffer(
      CVDocument({ cv: cvData, language, template }),
    );

    log.info("pdf rendered", { cvId, userId: user.id, template });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(cv.title ?? "cv").replace(/[^a-z0-9_\-]/gi, "_")}.pdf"`,
      },
    });
  } catch (err) {
    log.error("pdf render failed", { cvId, err });
    return serverError(
      "Couldn't generate the PDF. Please try again.",
    );
  }
});

