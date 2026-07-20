/**
 * Claude CV provider — the default and guaranteed-available model. Uses the
 * shared prompt/parser so its output is directly comparable to other providers.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { CVData, Language, QAPair } from "@/types/cv";
import type { CVModelProvider } from "./provider";
import { buildSystemPrompt, buildUserMessage, LANGUAGE_NAME } from "./prompt";
import { parseCVJson } from "./parse";
import { withRetry } from "@/lib/ai/retry";
import { logger } from "@/lib/log";

export const CLAUDE_CV_MODEL = "claude-sonnet-4-6";

export const claudeCVProvider: CVModelProvider = {
  name: CLAUDE_CV_MODEL,

  isConfigured() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  },

  async generate(
    qaPairs: QAPair[],
    language: Language,
    outputLanguage: Language,
    exemplars: string[] = [],
  ): Promise<CVData> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const anthropic = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });

    const outputName = LANGUAGE_NAME[outputLanguage];
    const response = await withRetry(
      () =>
        anthropic.messages.create({
          model: CLAUDE_CV_MODEL,
          max_tokens: 2500,
          // Cache the (constant, guideline-heavy) system prompt so repeated
          // generations only pay ~10% for it after the first call in the window.
          system: [
            {
              type: "text",
              text: buildSystemPrompt(outputName),
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: buildUserMessage(qaPairs, language, outputName, exemplars),
            },
          ],
        }),
      { onRetry: (err, attempt) => logger.warn("claude cv retry", { attempt, err }) },
    );

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Claude returned no text content");
    }
    return parseCVJson(textBlock.text);
  },
};
