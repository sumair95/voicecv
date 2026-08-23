"use client";

/**
 * Typed array-edit helpers for a CV.
 *
 * Before this hook, every "+ Add skill", "remove skill at i", "edit skill at i"
 * was implemented inline at the call site with a fresh closure that copies the
 * array, splices/sets/pushes, and calls `patch({ key: next })`. That pattern
 * was repeated 60+ times across templates.
 *
 * Now:
 *   const cv = usePatchableCV(data, patch);
 *   cv.add('skills', '');
 *   cv.update('skills', i, value);
 *   cv.remove('skills', i);
 *   cv.update('experience', i, { ...exp, role: v });
 *
 * Type-safe: TS knows the element type for each array key.
 */

import { useMemo } from "react";
import type { CVData } from "@/types/cv";

/**
 * The array fields that hold CV *content*. `section_order` is excluded on
 * purpose: it is layout configuration, reordered through `lib/cv/section-order`
 * rather than added to and spliced like a list of jobs.
 *
 * The `-?` matters. Without it an optional field maps to `K | undefined`, so
 * `undefined` leaks into this union and `CVData[K]` stops being indexable —
 * which is exactly what adding `section_order?:` did.
 */
type ContentKeys = Exclude<keyof CVData, "section_order">;

type ArrayKeys = {
  [K in ContentKeys]-?: CVData[K] extends Array<unknown> ? K : never;
}[ContentKeys];

type ElemOf<K extends ArrayKeys> = CVData[K] extends Array<infer E> ? E : never;

export interface PatchableCV {
  add<K extends ArrayKeys>(key: K, item: ElemOf<K>): void;
  update<K extends ArrayKeys>(key: K, index: number, item: ElemOf<K>): void;
  remove<K extends ArrayKeys>(key: K, index: number): void;
}

export function usePatchableCV(
  data: CVData,
  patch: (next: Partial<CVData>) => void,
): PatchableCV {
  return useMemo<PatchableCV>(
    () => ({
      add(key, item) {
        const arr = data[key] as ReadonlyArray<unknown>;
        patch({ [key]: [...arr, item] } as Partial<CVData>);
      },
      update(key, index, item) {
        const next = [...(data[key] as ReadonlyArray<unknown>)];
        next[index] = item;
        patch({ [key]: next } as Partial<CVData>);
      },
      remove(key, index) {
        const next = [...(data[key] as ReadonlyArray<unknown>)];
        next.splice(index, 1);
        patch({ [key]: next } as Partial<CVData>);
      },
    }),
    [data, patch],
  );
}
