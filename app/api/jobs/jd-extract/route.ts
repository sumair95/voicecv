/**
 * Read a job description out of an uploaded file so the user can drop in the
 * PDF a recruiter emailed them instead of copy-pasting it.
 *
 * Plain-text files are decoded here. PDFs go to Claude as a native document
 * block — the model reads the page content directly, which avoids adding a PDF
 * parsing dependency and handles the two-column layouts job boards love.
 *
 * The extracted text is returned to the client and shown in an editable box: it
 * is the user's input, and they get to see and correct exactly what we read
 * before spending an analysis on it. It stays untrusted all the way through —
 * `analyzeJdMatch` treats it as data, never instructions.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, serverError, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { CLAUDE_TEXT_MODEL } from "@/lib/ai/models";
import { MAX_JD_CHARS } from "@/lib/jobs/jd-match";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generous for a job ad, small enough that a stray upload can't cost real money. */
const MAX_BYTES = 6 * 1024 * 1024;

const TEXT_TYPES = ["text/plain", "text/markdown", "text/html"];

export const POST = handle("jobs-jd-extract", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`jdextract:${user.id}`, LIMITS.jdExtract);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many uploads. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) },
      },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("file required");
  if (file.size === 0) return badRequest("That file is empty.");
  if (file.size > MAX_BYTES) return badRequest("That file is too large (max 6 MB).");

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = file.name ?? "";
  const isPdf =
    file.type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
  const isText =
    TEXT_TYPES.includes(file.type) || /\.(txt|md|markdown)$/i.test(name);

  // Plain text needs no model call at all.
  if (isText) {
    const text = bytes.toString("utf8").trim().slice(0, MAX_JD_CHARS);
    if (!text) return badRequest("That file had no readable text.");
    log.info("jd extracted from text file", { userId: user.id, chars: text.length });
    return ok({ text });
  }

  if (!isPdf) {
    return badRequest(
      "Upload a PDF or a .txt file, or paste the job description instead.",
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return serverError("File reading is unavailable right now.");

  try {
    const anthropic = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 1 });
    const resp = await anthropic.messages.create({
      model: CLAUDE_TEXT_MODEL,
      max_tokens: 4000,
      // Transcription, not judgement — no thinking, minimum effort.
      thinking: { type: "disabled" },
      output_config: { effort: "low" },
      system:
        "You transcribe job postings from documents. Return the posting's text as plain text, preserving headings, requirements and responsibilities as readable lines. Do not summarise, do not add commentary, do not add markdown fences. If the document is not a job posting, return exactly: NOT_A_JOB_POSTING",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: bytes.toString("base64"),
              },
            },
            { type: "text", text: "Transcribe this job posting as plain text." },
          ],
        },
      ],
    });

    if (resp.stop_reason === "refusal") {
      return badRequest("Couldn't read that file. Paste the job description instead.");
    }

    const block = resp.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";
    if (!text || text.startsWith("NOT_A_JOB_POSTING")) {
      return badRequest(
        "That file doesn't look like a job description. Paste the text instead.",
      );
    }

    log.info("jd extracted from pdf", {
      userId: user.id,
      bytes: file.size,
      chars: text.length,
    });
    return ok({ text: text.slice(0, MAX_JD_CHARS) });
  } catch (err) {
    log.warn("jd pdf extraction failed", { err });
    return serverError("Couldn't read that file. Paste the job description instead.");
  }
});
