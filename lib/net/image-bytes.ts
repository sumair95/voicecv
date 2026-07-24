/**
 * Magic-byte image sniffing (H3).
 *
 * The photo routes must never trust a client-supplied `Content-Type`: an
 * attacker can label an SVG (which can carry <script>) as "image/jpeg" and, in
 * a PUBLIC bucket, get an XSS/phishing page hosted under our storage origin.
 * And on the way OUT (Gemini → storage) the bytes come from a third party, so
 * they must be re-sniffed too.
 *
 * So the rule is: decide the type from the BYTES, never from a header or file
 * name, and allow only real raster formats. SVG is intentionally excluded — it
 * is XML/executable, not a raster image.
 */

export type SniffedImage = "image/jpeg" | "image/png" | "image/webp";

/**
 * Return the real image type from the leading bytes, or null if the buffer is
 * not one of the allowed raster formats. Checks:
 *   JPEG  FF D8 FF
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   WEBP  "RIFF" .... "WEBP"
 */
export function sniffImageType(buf: Buffer): SniffedImage | null {
  if (buf.length < 12) return null;

  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP: "RIFF"<4-byte size>"WEBP"
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

/** File extension for a sniffed type — used to name the storage object. */
export function extFor(type: SniffedImage): "jpg" | "png" | "webp" {
  return type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp";
}
