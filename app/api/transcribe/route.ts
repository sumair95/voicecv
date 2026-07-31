import { NextResponse } from "next/server";
import { transcribe } from "@/lib/whisper";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import type { Language } from "@/types/cv";

export const runtime = "nodejs";
export const maxDuration = 60;

// Whisper's hard limit is 25 MB; stay just under it.
const MAX_AUDIO_BYTES = 24_000_000;

export const POST = handle("transcribe", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`stt:${user.id}`, LIMITS.transcribe);
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
  // Bound the payload before it reaches Whisper (M6). Without this, a 20/min
  // rate limit still allows arbitrarily large uploads → unbounded STT spend.
  // Whisper's own hard limit is 25 MB; we cap a little under it.
  if (audio.size === 0) return badRequest("Empty audio file");
  if (audio.size > MAX_AUDIO_BYTES) {
    return badRequest("Recording too large (max 24MB). Record a shorter answer.");
  }
  // MIME is best-effort (some browsers omit it on Blobs); only reject a clearly
  // non-audio type when one is present.
  if (audio.type && !audio.type.startsWith("audio/") && !audio.type.startsWith("video/")) {
    return badRequest("Uploaded file must be audio");
  }

  const transcript = await transcribe(audio, language);
  log.info("transcribed", {
    userId: user.id,
    bytes: audio.size,
    lang: language,
  });
  return ok({ transcript });
});
