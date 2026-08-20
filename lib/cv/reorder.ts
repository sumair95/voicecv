/**
 * Reordering helpers for CV list sections (currently experience).
 *
 * Two ways to reorder, deliberately:
 *
 *  - `moveItem` powers the per-entry ↑/↓ buttons. Always works, needs no
 *    understanding of the text, and is the one the user can rely on.
 *  - `sortExperienceByDate` powers the one-click "Newest first" button. It is
 *    BEST-EFFORT: `duration` is free text typed (or spoken) by the user in any
 *    of four languages — "2021 - present", "Jan 2019 – Mar 2021", "٢٠٢٠ إلى الآن",
 *    "3 anni". Nothing can parse all of that reliably, so entries whose dates we
 *    cannot read are never shuffled around blindly — they keep their relative
 *    order and sink below the ones we could read.
 *
 * That split is why the manual buttons exist at all: sorting is a convenience,
 * not a promise.
 */

import type { CVExperienceItem } from "@/types/cv";

/** Move `from` to `to`, returning a new array. Out-of-range moves are no-ops. */
export function moveItem<T>(arr: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return [...arr];
  }
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * Words meaning "still working here", across the four supported languages plus
 * the English the AI writes for AR/UR CVs. A role that is current must sort to
 * the top regardless of its start year.
 */
const PRESENT_WORDS =
  /(present|current|now|today|ongoing|to date|attuale|presente|oggi|in corso|الحالي|حتى الآن|الآن|لغاية الآن|حال|موجودہ|اب تک|تاحال)/i;

/** Arabic-Indic and Extended Arabic-Indic digits → ASCII, so years parse. */
function normaliseDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/** Every 4-digit year in the string that could plausibly be a work date. */
function yearsIn(duration: string): number[] {
  const now = new Date().getFullYear();
  return (normaliseDigits(duration).match(/\b(19|20)\d{2}\b/g) ?? [])
    .map(Number)
    .filter((y) => y >= 1950 && y <= now + 1);
}

/**
 * Sort key for one entry: `[endYear, startYear]`, both `null` when unreadable.
 * A current role gets `Infinity` so it outranks every dated one.
 */
export function experienceDateKey(duration: string): {
  end: number | null;
  start: number | null;
} {
  const text = duration ?? "";
  const years = yearsIn(text);
  const isPresent = PRESENT_WORDS.test(text);

  if (years.length === 0) {
    return { end: isPresent ? Infinity : null, start: null };
  }
  return {
    end: isPresent ? Infinity : Math.max(...years),
    start: Math.min(...years),
  };
}

/**
 * Newest first. Entries with no readable date keep their relative order and are
 * placed after the dated ones, so a sort can never silently scramble a CV whose
 * durations we failed to understand.
 */
export function sortExperienceByDate(
  items: readonly CVExperienceItem[],
): CVExperienceItem[] {
  return items
    .map((item, index) => ({ item, index, key: experienceDateKey(item.duration) }))
    .sort((a, b) => {
      const aDated = a.key.end !== null;
      const bDated = b.key.end !== null;
      if (aDated !== bDated) return aDated ? -1 : 1;
      if (!aDated) return a.index - b.index; // both undated → stable
      if (a.key.end !== b.key.end) return (b.key.end ?? 0) - (a.key.end ?? 0);
      if (a.key.start !== b.key.start) return (b.key.start ?? 0) - (a.key.start ?? 0);
      return a.index - b.index; // fully tied → stable
    })
    .map((entry) => entry.item);
}

/** True when sorting would actually change something (drives the disabled state). */
export function needsDateSort(items: readonly CVExperienceItem[]): boolean {
  const sorted = sortExperienceByDate(items);
  return sorted.some((item, i) => item !== items[i]);
}
