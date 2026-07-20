/**
 * Loads the CV / cover-letter style guidelines (the RAG knowledge base at
 * lib/prompts/cv_cover_letter_guidelines.md) so every generation follows them.
 *
 * The file is the single source of truth — edit it to change how CVs and cover
 * letters are written. We strip its "OUTPUT FORMAT" section because that section
 * describes a different JSON shape than our own CVData schema (which stays
 * authoritative). Read once and cached in memory; returns "" if unreadable so
 * generation degrades gracefully rather than failing.
 *
 * Server-only (uses fs) — only imported by the server-side generation providers.
 */

import fs from "node:fs";
import path from "node:path";
import { logger } from "@/lib/log";

let cache: string | null | undefined;

export function styleGuidelines(): string {
  if (cache !== undefined) return cache ?? "";
  try {
    const file = path.join(process.cwd(), "lib", "prompts", "cv_cover_letter_guidelines.md");
    let text = fs.readFileSync(file, "utf8");
    // Drop the output-format section — our CVData JSON schema is authoritative.
    const cut = text.indexOf("## OUTPUT FORMAT INSTRUCTIONS");
    if (cut > 0) text = text.slice(0, cut).trim();
    cache = text;
  } catch (err) {
    logger.warn("style guidelines unreadable; generating without them", { err });
    cache = null;
  }
  return cache ?? "";
}
