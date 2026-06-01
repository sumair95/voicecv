import { NextResponse } from "next/server";
import { generateCV } from "@/lib/claude";
import { createClient } from "@/lib/supabase/server";
import type { Language, QAPair } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RequestBody {
  cvId?: string;
  qaPairs: QAPair[];
  language: Language;
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as RequestBody;
    if (!Array.isArray(body.qaPairs) || body.qaPairs.length === 0) {
      return NextResponse.json({ error: "qaPairs required" }, { status: 400 });
    }

    let cvId = body.cvId;
    const transcript = body.qaPairs
      .map((qa) => `${qa.question}\n${qa.answer}`)
      .join("\n\n");

    if (!cvId) {
      const { data, error } = await supabase
        .from("cvs")
        .insert({
          user_id: user.id,
          status: "processing",
          transcript,
        })
        .select("id")
        .single();
      if (error) throw error;
      cvId = data!.id as string;
    } else {
      await supabase
        .from("cvs")
        .update({ status: "processing", transcript })
        .eq("id", cvId)
        .eq("user_id", user.id);
    }

    const cvData = await generateCV(body.qaPairs, body.language);

    const title = cvData.personal?.full_name || "My CV";
    await supabase
      .from("cvs")
      .update({
        cv_data: cvData,
        title,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", cvId)
      .eq("user_id", user.id);

    return NextResponse.json({ cvId, cvData });
  } catch (err) {
    console.error("/api/generate-cv error", err);
    const message = err instanceof Error ? err.message : "CV generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
