/**
 * Professional-photo conversion via remove.bg.
 *
 * "Background + retouch" launch scope (Sumair's decision): remove the messy
 * background, drop the subject onto a clean WHITE background, and auto-crop to a
 * head-and-shoulders headshot. No generative attire — culturally safe and
 * reliable. Reads REMOVEBG_API_KEY lazily so the app boots without it.
 *
 * Docs: https://www.remove.bg/api
 */

const ENDPOINT = "https://api.remove.bg/v1.0/removebg";
const TIMEOUT_MS = 30_000;

export function isPhotoEnhanceConfigured(): boolean {
  return Boolean(process.env.REMOVEBG_API_KEY);
}

/** Convert the image at `imageUrl` into a white-background headshot (JPEG bytes). */
export async function toProfessionalPhoto(imageUrl: string): Promise<Buffer> {
  const key = process.env.REMOVEBG_API_KEY;
  if (!key) {
    throw new Error("Professional photo is not configured (missing REMOVEBG_API_KEY).");
  }

  const form = new URLSearchParams({
    image_url: imageUrl,
    size: "auto",
    type: "person",
    bg_color: "ffffff", // clean white background
    crop: "true", // crop to the subject → head-and-shoulders headshot
    // Margins per side (top right bottom left). A little headroom + side space,
    // but ZERO bottom so the subject reaches the frame's bottom edge — that way
    // the photo fills the circular avatar and the body's cut sits under the
    // circle's curve instead of leaving a white strip + hard line at the bottom.
    crop_margin: "8% 5% 0% 5%",
    format: "jpg",
  });

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "X-Api-Key": key,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
      signal: ac.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let msg = `Photo conversion failed (HTTP ${res.status}).`;
      if (res.status === 402) msg = "remove.bg credits exhausted — top up the plan.";
      else if (res.status === 403) msg = "Photo key rejected (check REMOVEBG_API_KEY).";
      else if (res.status === 400) msg = "Couldn't process this image — try a clearer photo of a face.";
      throw new Error(body ? `${msg} ${body.slice(0, 150)}` : msg);
    }
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}
