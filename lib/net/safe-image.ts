/**
 * SSRF guard for server-side image fetches (C2).
 *
 * Both the PDF exporter and the Gemini photo enhancer fetch an image by URL.
 * Those URLs come from `cvs.cv_data.personal.photo_url` and
 * `profiles.photo_url` — the first is written directly by the browser (the CV
 * editor persists the whole cv_data blob), so it is fully attacker-controlled.
 *
 * Without a check, a user could point it at `http://169.254.169.254/…` (cloud
 * instance metadata) or any internal service and have the bytes embedded into a
 * PDF they then download — a working exfiltration channel, not merely a blind
 * probe. Checking the response `content-type` is not a defence: the attacker's
 * own server chooses that header.
 *
 * Every photo we legitimately render was uploaded through /api/photo/upload and
 * therefore lives in our own Supabase storage. So the rule is simply: https, and
 * the host must be the Supabase project host. Anything else is dropped and the
 * caller renders without a photo.
 */

/** Host of the Supabase project, e.g. "abcdefg.supabase.co". */
function supabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).host.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * True only for an https URL served by our own Supabase storage.
 * Fails closed: a malformed URL, or a missing/invalid SUPABASE_URL, returns false.
 */
export function isAllowedImageUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;

  // Data URIs are already inline bytes — no network request, nothing to SSRF.
  // (The PDF path may re-enter with an inlined value.)
  if (raw.startsWith("data:image/")) return true;

  const allowed = supabaseHost();
  if (!allowed) return false;

  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }

  if (u.protocol !== "https:") return false;
  // Exact host match, not endsWith — "evil-abcdefg.supabase.co.attacker.com"
  // and "attacker.com/?x=abcdefg.supabase.co" must both fail.
  return u.host.toLowerCase() === allowed;
}
