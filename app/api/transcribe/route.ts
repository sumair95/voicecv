import { NextResponse } from "next/server";
import { transcribe } from "@/lib/whisper";
import { createClient } from "@/lib/supabase/server";
import type { Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const audio = form.get("audio");
    const language = (form.get("language") as Language) || "en";

    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const transcript = await transcribe(audio, language);
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("/api/transcribe error", err);
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
