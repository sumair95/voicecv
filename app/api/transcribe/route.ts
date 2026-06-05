import { NextResponse } from "next/server";
import { transcribe } from "@/lib/whisper";
import { createClient } from "@/lib/supabase/server";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import type { Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = handle("transcribe", async ({ req, log }) => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const rate = take(`stt:${user.id}`, LIMITS.transcribe);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many transcriptions. Try again in a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const form = await req.formData();
  const audio = form.get("audio");
  const language = (form.get("language") as Language) || "en";

  if (!(audio instanceof Blob)) return badRequest("Missing audio file");

  const transcript = await transcribe(audio, language);
  log.info("transcribed", {
    userId: user.id,
    bytes: audio.size,
    lang: language,
  });
  return ok({ transcript });
});
