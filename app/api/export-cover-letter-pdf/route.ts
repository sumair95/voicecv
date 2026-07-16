import { renderToBuffer } from "@react-pdf/renderer";
import { getAuthContext } from "@/lib/api/auth";
import { CoverLetterDocument } from "@/lib/cover-letter-pdf";
import { handle } from "@/lib/api/handle";
import { badRequest, conflict, notFound, unauthorized, serverError, paymentRequired } from "@/lib/api/respond";
import { isCompAccount } from "@/lib/premium/access";
import { logEvent } from "@/lib/analytics-server";
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

  // Download is premium. First download for a CV spends one cover_letter_credit
  // and unlocks the CV permanently; after that, re-downloads are free. Comped
  // reviewers unlock for free (no credit spent).
  if (!cv.cover_letter_unlocked) {
    if (await isCompAccount(supabase)) {
      await supabase
        .from("cvs")
        .update({ cover_letter_unlocked: true })
        .eq("id", cvId)
        .eq("user_id", user.id);
      await logEvent(supabase, user.id, "cover_letter_unlocked", { cvId, comp: true });
    } else {
      const { data: spent, error: rpcErr } = await supabase.rpc(
        "consume_cover_letter_credit",
      );
      if (rpcErr) throw rpcErr;
      if (!spent) return paymentRequired("Cover letter download is a Premium feature");
      await supabase
        .from("cvs")
        .update({ cover_letter_unlocked: true })
        .eq("id", cvId)
        .eq("user_id", user.id);
      await logEvent(supabase, user.id, "cover_letter_unlocked", { cvId });
    }
  }

  const language: Language = cv.language ?? "en";
  const p = cv.cv_data?.personal;
  const name = p?.full_name || cv.title || "Cover Letter";
  const contact = [
    p?.email,
    p?.phone,
    [p?.city, p?.country].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join("   |   ");

  try {
    const buffer = await renderToBuffer(
      CoverLetterDocument({ name, body: cv.cover_letter, language, contact }),
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
