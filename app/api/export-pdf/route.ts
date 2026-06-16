import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthContext } from "@/lib/api/auth";
import { CVDocument } from "@/lib/pdf-generator";
import { migrateCvData } from "@/lib/cv/migrate";
import { isUserEntitled, DEFAULT_TEMPLATE } from "@/lib/cv/templates";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, unauthorized, conflict, serverError } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import type { CVRecord, Language, TemplateId } from "@/types/cv";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle("export-pdf", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`pdf:${user.id}`, LIMITS.exportPdf);
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

  // The CV is always rendered in English for recruiter readability,
  // regardless of the user's UI language.
  const language: Language = "en";

  let template = ((cv as unknown as { template?: TemplateId }).template ??
    DEFAULT_TEMPLATE) as TemplateId;
  // Server-side entitlement check — a tampered client cannot save a
  // premium template into cvs.template and then download it.
  if (!isUserEntitled(user.id, template)) {
    log.warn("template downgrade — not entitled", {
      userId: user.id,
      cvId,
      requested: template,
    });
    template = DEFAULT_TEMPLATE;
  }

  try {
    const buffer = await renderToBuffer(
      CVDocument({ cv: migrateCvData(cv.cv_data), language, template }),
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
      err instanceof Error ? err.message : "PDF generation failed",
    );
  }
});

