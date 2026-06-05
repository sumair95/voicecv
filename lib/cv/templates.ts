/**
 * Template catalog + entitlement check.
 *
 * Moved off `types/cv.ts` so that file is type-only. The `isUserEntitled`
 * helper is the single source of truth for whether a user can use a
 * given template — both the picker UI and the server-side route enforce
 * the same rule.
 *
 * Today: any free user can pick any template that has `premium: false`.
 * Premium templates are locked. When we add real billing, replace this
 * function with a real lookup (Stripe subscription status, etc.).
 */

import type { TemplateId } from "@/types/cv";

export interface TemplateInfo {
  id: TemplateId;
  name: string;
  description: string;
  /** Whether this template is part of the premium plan. */
  premium: boolean;
}

export const TEMPLATES: TemplateInfo[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Navy sidebar with teal accents — the default.",
    premium: false,
  },
  {
    id: "minimalist",
    name: "Minimalist",
    description: "Single column, lots of whitespace, light typography.",
    premium: false,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Centered traditional layout — coming soon.",
    premium: true,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Bold left accent bar — coming soon.",
    premium: true,
  },
];

export const DEFAULT_TEMPLATE: TemplateId = "modern";

export function getTemplate(id: TemplateId | null | undefined): TemplateInfo {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}

/**
 * Is the user entitled to use this template right now?
 * Wire to a billing service when we launch the paid tier.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isUserEntitled(_userId: string, templateId: TemplateId): boolean {
  const tpl = getTemplate(templateId);
  return !tpl.premium;
}
