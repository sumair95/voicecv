/**
 * OpenAI (GPT) CV provider — competes with Claude. Uses the SAME shared prompt
 * + parser so the outputs are comparable. Reads the existing OPENAI_API_KEY
 * (already configured for Whisper), so no new credential is needed.
 *
 * Raw fetch against the Chat Completions API — no extra dependency. Bounded by
 * an 45s timeout so a slow provider can't stall the generation route.
 */

import type { CVData, Language, QAPair } from "@/types/cv";
import type { CVModelProvider } from "./provider";
import { buildSystemPrompt, buildUserMessage, LANGUAGE_NAME } from "./prompt";
import { parseCVJson } from "./parse";
import { OPENAI_TEXT_MODEL } from "@/lib/ai/models";

const MODEL = OPENAI_TEXT_MODEL;
const TIMEOUT_MS = 45_000;

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
}

export const openaiCVProvider: CVModelProvider = {
  name: MODEL,

  isConfigured() {
    return Boolean(process.env.OPENAI_API_KEY);
  },

  async generate(
    qaPairs: QAPair[],
    language: Language,
    outputLanguage: Language,
    exemplars: string[] = [],
  ): Promise<CVData> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

    const outputName = LANGUAGE_NAME[outputLanguage];
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: ac.signal,
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2500,
          // Force a JSON object back so the shared parser always has clean input.
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: buildSystemPrompt(outputName) },
            {
              role: "user",
              content: buildUserMessage(qaPairs, language, outputName, exemplars),
            },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`OpenAI CV generation failed (HTTP ${res.status}): ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as ChatCompletion;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned no content");
      return parseCVJson(content);
    } finally {
      clearTimeout(timer);
    }
  },
};
