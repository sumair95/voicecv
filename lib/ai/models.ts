/**
 * Single source of truth for the model ids the app calls (M7).
 *
 * These strings were previously hardcoded in eight places, so a deprecation
 * silently broke several features at once — and two call sites fail QUIETLY
 * (the photo classifier defaults to "clean" but still spends a credit; the CV
 * judge returns all-zeros and Claude wins by tie-break). Centralising them means
 * one edit on a model bump, and /api/health can ping the configured id.
 *
 * Override per-environment without a redeploy via env vars (optional).
 */

/** Primary Claude model used for CV writing, tailoring, judging, job match, etc. */
export const CLAUDE_TEXT_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

/** OpenAI challenger model for the multi-model CV competition. */
export const OPENAI_TEXT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o";

/** OpenAI Whisper model for voice transcription. */
export const WHISPER_MODEL = process.env.WHISPER_MODEL ?? "whisper-1";

/** Google Gemini image model for the generative "suited headshot". */
export const GEMINI_IMAGE_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.5-flash-image";
