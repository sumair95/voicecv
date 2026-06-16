import { generateCV } from "@/lib/claude";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import type { Language, QAPair } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RequestBody {
  cvId?: string;
  qaPairs: QAPair[];
  language: Language;
}

export const POST = handle("generate-cv", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = take(`gen:${user.id}`, LIMITS.generateCv);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many CV generations. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const body = (await req.json()) as RequestBody;
  if (!Array.isArray(body.qaPairs) || body.qaPairs.length === 0) {
    return badRequest("qaPairs required");
  }

  const transcript = body.qaPairs
    .map((qa) => `${qa.question}\n${qa.answer}`)
    .join("\n\n");

  // Generate first; insert/update the cvs row only after Claude succeeds.
  // Avoids zombie status='processing' rows when the model call fails.
  log.info("generating cv", {
    userId: user.id,
    cvId: body.cvId ?? null,
    questions: body.qaPairs.length,
  });
  const cvData = await generateCV(body.qaPairs, body.language);
  const title = cvData.personal?.full_name || "My CV";

  let cvId = body.cvId;
  if (!cvId) {
    const { data, error } = await supabase
      .from("cvs")
      .insert({
        user_id: user.id,
        status: "ready",
        transcript,
        cv_data: cvData,
        title,
      })
      .select("id")
      .single();
    if (error) throw error;
    cvId = data!.id as string;
  } else {
    const { error } = await supabase
      .from("cvs")
      .update({
        cv_data: cvData,
        transcript,
        title,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", user.id);
    if (error) throw error;
  }

  log.info("cv generated", { cvId, userId: user.id });
  return ok({ cvId, cvData });
});
