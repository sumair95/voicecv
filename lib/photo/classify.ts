/**
 * Decide the photo treatment from the candidate's role:
 *  - "suit"  → office / professional / managerial / sales / teaching / technical
 *              / healthcare / finance, where a business suit reads as appropriate.
 *  - "clean" → manual / blue-collar / casual (construction, delivery, driving,
 *              cleaning, security, warehouse, trades, hospitality), where a suit
 *              would look inauthentic — just a clean white background instead.
 *
 * Best-effort: defaults to "clean" (the safe, non-generative choice) on no role
 * or any failure.
 */

import Anthropic from "@anthropic-ai/sdk";
import { logger } from "@/lib/log";
import { CLAUDE_TEXT_MODEL } from "@/lib/ai/models";

export type PhotoStyle = "suit" | "clean";

export async function classifyPhotoStyle(role: string): Promise<PhotoStyle> {
  const r = role.trim();
  if (!r) return "clean";
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return "clean";

  try {
    const anthropic = new Anthropic({ apiKey, timeout: 10_000, maxRetries: 1 });
    const resp = await anthropic.messages.create({
      model: CLAUDE_TEXT_MODEL,
      max_tokens: 5,
      system:
        'Classify a job role for CV-photo styling. Reply with ONE word only: "suit" if the role is office/professional/managerial/sales/marketing/teaching/technical/healthcare/finance where a business suit is appropriate; "clean" if the role is manual/blue-collar/casual (construction, delivery, driving, cleaning, security, warehouse, trades, hospitality) where a suit would look inauthentic. Only "suit" or "clean".',
      messages: [{ role: "user", content: `Role: ${r}` }],
    });
    const block = resp.content.find((b) => b.type === "text");
    const txt = (block && block.type === "text" ? block.text : "").toLowerCase();
    return txt.includes("suit") ? "suit" : "clean";
  } catch (err) {
    logger.warn("classifyPhotoStyle failed; defaulting to clean", { err });
    return "clean";
  }
}
