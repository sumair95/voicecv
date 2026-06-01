import OpenAI from "openai";
import type { Language } from "@/types/cv";

function client() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey });
}

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
    language: language === "ar" ? "ar" : "en",
  });

  return transcription.text;
}
