import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthContext } from "@/lib/api/auth";
import { CoverLetterDocument } from "@/lib/cover-letter-pdf";
import { handle } from "@/lib/api/handle";
import { badRequest, conflict, notFound, unauthorized, serverError } from "@/lib/api/respond";
import { NextResponse } from "next/server";
import type { CVRecord, Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle("export-cover-letter-pdf", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

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
  if (!cv.cover_letter) return conflict("No cover letter yet");

  const language: Language = cv.language ?? "en";
  const name = cv.cv_data?.personal?.full_name || cv.title || "Cover Letter";

  try {
    const buffer = await renderToBuffer(
      CoverLetterDocument({ name, body: cv.cover_letter, language }),
    );
    log.info("cover letter pdf rendered", { cvId, userId: user.id });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${name.replace(/[^a-z0-9_\-]/gi, "_")}_cover_letter.pdf"`,
      },
    });
  } catch (err) {
    log.error("cover letter pdf failed", { cvId, err });
    return serverError(err instanceof Error ? err.message : "PDF generation failed");
  }
});
