/**
 * Per-CV section ordering, shared by every template and the PDF.
 *
 * The order is ONE global list (`cv.section_order`). Each template renders the
 * subset of sections it actually shows, in that list's relative order — so the
 * same stored order produces a consistent result whether the CV is rendered as
 * Modern (two columns), Minimalist, Classic or Executive, and whether it's on
 * screen or in the downloaded PDF.
 */

import type { CVData, SectionId } from "@/types/cv";

/** The order every CV starts in, and the fallback for anything unrecognised. */
export const DEFAULT_SECTION_ORDER: SectionId[] = [
  "objective",
  "experience",
  "education",
  "certificates",
  "skills",
  "languages",
  "hobbies",
  "achievements",
];

const KNOWN = new Set<string>(DEFAULT_SECTION_ORDER);

/**
 * Clean a stored order into something safe to render from: keep the recognised
 * ids in the order given, drop anything unknown or duplicated, then append any
 * section the list is missing.
 *
 * That last step is what stops a CV saved today from losing a section we add
 * later — an unknown-to-the-CV section reappears at its default position
 * instead of silently vanishing from the document.
 */
export function normaliseSectionOrder(raw: unknown): SectionId[] {
  const seen = new Set<SectionId>();
  const out: SectionId[] = [];
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      if (typeof entry === "string" && KNOWN.has(entry) && !seen.has(entry as SectionId)) {
        seen.add(entry as SectionId);
        out.push(entry as SectionId);
      }
    }
  }
  for (const id of DEFAULT_SECTION_ORDER) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

/** The CV's order, normalised. Safe to call on any CV, old or new. */
export function sectionOrderOf(cv: CVData): SectionId[] {
  return normaliseSectionOrder(cv.section_order);
}

/**
 * The sections a given region renders, in the user's order.
 * `available` is the set that region knows how to draw (e.g. the Modern
 * sidebar only draws skills/languages/hobbies).
 */
export function orderedSections(
  cv: CVData,
  available: readonly SectionId[],
): SectionId[] {
  const allow = new Set(available);
  return sectionOrderOf(cv).filter((id) => allow.has(id));
}

/**
 * Move one section up or down **within its own region**.
 *
 * The `within` set matters and is the whole reason this isn't a plain array
 * swap: Modern splits sections across a sidebar and a main column, so the id
 * immediately before "skills" in the global list may well be "experience",
 * which lives in the other column. Swapping those two would reorder the global
 * list while changing nothing the user can see in the sidebar — an arrow that
 * looks broken. So we find the nearest neighbour that is also in `within` and
 * swap with that, leaving every other section where it is.
 */
export function moveSection(
  cv: CVData,
  id: SectionId,
  direction: "up" | "down",
  within: readonly SectionId[],
): SectionId[] {
  const order = sectionOrderOf(cv);
  const allow = new Set(within);
  const from = order.indexOf(id);
  if (from === -1 || !allow.has(id)) return order;

  const step = direction === "up" ? -1 : 1;
  let to = from + step;
  while (to >= 0 && to < order.length && !allow.has(order[to])) to += step;
  if (to < 0 || to >= order.length) return order; // already first/last in its region

  const next = [...order];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Whether a section can still move that way inside its region (drives disabled state). */
export function canMoveSection(
  cv: CVData,
  id: SectionId,
  direction: "up" | "down",
  within: readonly SectionId[],
): boolean {
  const visible = orderedSections(cv, within);
  const i = visible.indexOf(id);
  if (i === -1) return false;
  return direction === "up" ? i > 0 : i < visible.length - 1;
}
