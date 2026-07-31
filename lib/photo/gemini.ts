/**
 * Generative "suited headshot" via Google Gemini's image model — for office /
 * professional roles (see lib/photo/classify.ts). Preserves the person's
 * identity while adding a business suit + clean white background.
 *
 * Reads GEMINI_API_KEY lazily so the app boots without it; when absent the
 * caller falls back to the remove.bg clean-background conversion.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */

import { isAllowedImageUrl } from "@/lib/net/safe-image";
import { GEMINI_IMAGE_MODEL } from "@/lib/ai/models";

const MODEL = GEMINI_IMAGE_MODEL;
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const FETCH_TIMEOUT_MS = 45_000;

// Reframed as a CV headshot (not an "official passport", which an AI-edited
// photo cannot legitimately be). Two variants, chosen by role:
//  - suit: office/professional → business suit.
//  - enhance: manual/casual → natural retouch, no suit (stays authentic).
const SUIT_PROMPT = `Transform this into a professional, realistic CV headshot of the SAME person. Critical: keep the person's identity and face shape EXACTLY the same — it must clearly be the same individual. Changes: pure white background; dress them in a smart three-piece business suit with a suitable tie; remove eyeglasses; neaten the hairstyle to suit the face; lightly enhance the beard and facial features with a natural finish while keeping the exact resemblance. Head-and-shoulders, front-facing, evenly lit, authentic and realistic — not artificial. Output only the edited photo: no text, borders, or watermark.`;
const ENHANCE_PROMPT = `Transform this into a polished, realistic professional headshot of the SAME person for a CV. Critical: keep the person's identity, face shape, and features EXACTLY the same. Changes: pure white background; KEEP their existing everyday clothing — do NOT add a business suit; neaten the hair to suit the face; lightly enhance grooming, skin, and lighting with a natural, realistic finish. Head-and-shoulders, front-facing, evenly lit, authentic — not artificial. Output only the edited photo: no text, borders, or watermark.`;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** Generate an enhanced white-background headshot (image bytes) from `imageUrl`. */
export async function toEnhancedPhoto(
  imageUrl: string,
  variant: "suit" | "enhance",
): Promise<Buffer> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Suited photo is not configured (missing GEMINI_API_KEY).");

  // Load the source image and inline it as base64. `imageUrl` comes from
  // profiles.photo_url, so it is checked against our own storage host first —
  // otherwise this fetch is an SSRF sink (see lib/net/safe-image.ts).
  if (!isAllowedImageUrl(imageUrl)) {
    throw new Error("Source photo must be an uploaded VoiceCV photo.");
  }
  const imgRes = await fetch(imageUrl, {
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!imgRes.ok) throw new Error("Couldn't load the source photo.");
  const mimeType = imgRes.headers.get("content-type") || "image/jpeg";
  const b64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");

  const body = {
    contents: [
      {
        parts: [
          { text: variant === "suit" ? SUIT_PROMPT : ENHANCE_PROMPT },
          { inline_data: { mime_type: mimeType, data: b64 } },
        ],
      },
    ],
    generationConfig: { responseModalities: ["IMAGE"] },
  };

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal,
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Suited photo failed (HTTP ${res.status}).${t ? " " + t.slice(0, 180) : ""}`);
    }
    const json = (await res.json()) as {
      candidates?: { content?: { parts?: Array<Record<string, unknown>> } }[];
    };
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    // Response key casing varies (inline_data vs inlineData) — accept either.
    for (const p of parts) {
      const inline =
        (p.inline_data as { data?: string } | undefined) ??
        (p.inlineData as { data?: string } | undefined);
      if (inline?.data) return Buffer.from(inline.data, "base64");
    }
    throw new Error("Gemini returned no image.");
  } finally {
    clearTimeout(timer);
  }
}
