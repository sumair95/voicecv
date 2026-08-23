"use client";

/**
 * Glue between `lib/cv/section-order` and the templates.
 *
 * A template says which sections it draws in a given column and provides the
 * JSX for each; this returns them already in the user's order, each wrapped in
 * its ↑/↓ control. Every template therefore shares one ordering implementation
 * and one control, and the PDF reads the same `section_order` — so what the
 * user arranges on screen is what they download.
 */

import { SectionMover } from "@/components/cv/primitives";
import {
  canMoveSection,
  moveSection,
  orderedSections,
} from "@/lib/cv/section-order";
import type { CVData, SectionId } from "@/types/cv";

export interface SectionOrderCtx {
  data: CVData;
  editable?: boolean;
  patch: (next: Partial<CVData>) => void;
  t: (key: string) => string;
  /** Dark styling for the controls (Modern's navy sidebar). */
  dark?: boolean;
}

/**
 * Render the sections this column owns, in order, each movable within the
 * column. `blocks` maps a section id to its JSX; a section whose entry is
 * absent or nullish is skipped (that's how "hide when empty" keeps working).
 */
export function renderOrderedSections(
  ctx: SectionOrderCtx,
  within: readonly SectionId[],
  blocks: Partial<Record<SectionId, React.ReactNode>>,
): React.ReactNode[] {
  const { data, editable, patch, t, dark } = ctx;
  return orderedSections(data, within)
    .filter((id) => blocks[id] != null && blocks[id] !== false)
    .map((id) => (
      <SectionMover
        key={id}
        editable={editable}
        dark={dark}
        upLabel={t("edit.sectionUp")}
        downLabel={t("edit.sectionDown")}
        canUp={canMoveSection(data, id, "up", within)}
        canDown={canMoveSection(data, id, "down", within)}
        onUp={() => patch({ section_order: moveSection(data, id, "up", within) })}
        onDown={() =>
          patch({ section_order: moveSection(data, id, "down", within) })
        }
      >
        {blocks[id]}
      </SectionMover>
    ));
}
