import OpenAI from "openai";
import type { Language } from "@/types/cv";

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

// Whisper supports ISO-639-1 codes. ar/en/ur/hi are all native-supported.
export async function transcribe(
  audio: Blob,
  language: Language,
): Promise<string> {
  const openai = client();
  const file = new File([audio], "recording.webm", {
    type: audio.type || "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language,
  });

  return transcription.text;
}
