import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { CVDocument } from "@/lib/pdf-generator";
import type { CVData, CVRecord, Language, Profile } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { cvId } = (await req.json()) as { cvId: string };
    if (!cvId) {
      return NextResponse.json({ error: "cvId required" }, { status: 400 });
    }

    const [{ data: cvRow }, { data: profileRow }] = await Promise.all([
      supabase.from("cvs").select("*").eq("id", cvId).eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    if (!cvRow) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const cv = cvRow as CVRecord;
    const profile = profileRow as Profile | null;
    if (!cv.cv_data) {
      return NextResponse.json({ error: "CV is not ready" }, { status: 409 });
    }

    const language: Language = profile?.language ?? "en";

    const buffer = await renderToBuffer(
      CVDocument({ cv: cv.cv_data as CVData, language }),
    );

    await supabase
      .from("cvs")
      .update({ status: "exported", updated_at: new Date().toISOString() })
      .eq("id", cvId);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${(cv.title ?? "cv").replace(/[^a-z0-9_\-]/gi, "_")}.pdf"`,
      },
    });
  } catch (err) {
    console.error("/api/export-pdf error", err);
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
