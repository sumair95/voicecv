/**
 * "Improve your match" — for a low-scoring job, compare the candidate's CV to
 * the job and return the missing keywords + experience tips. The jobs page shows
 * a teaser (a couple of keywords) and blurs the rest behind a Premium upsell.
 *
 * Best-effort: returns empty arrays on any failure so the UI degrades cleanly.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, notFound, ok, unauthorized } from "@/lib/api/respond";
import { LIMITS, take } from "@/lib/rate-limit";
import { migrateCvData } from "@/lib/cv/migrate";
import { logger } from "@/lib/log";
import { NextResponse } from "next/server";
import { CLAUDE_TEXT_MODEL } from "@/lib/ai/models";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = CLAUDE_TEXT_MODEL;

interface Body {
  cvId?: string;
  jobTitle?: string;
  jobDescription?: string;
}

export const POST = handle("jobs-improve", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const rate = await take(`jobimprove:${user.id}`, LIMITS.jobImprove);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rate.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = (await req.json()) as Body;
  if (!body.cvId || !body.jobDescription) {
    return badRequest("cvId and jobDescription required");
  }

  const { data: cvRow } = await supabase
    .from("cvs")
    .select("cv_data")
    .eq("id", body.cvId)
    .eq("user_id", user.id)
    .single();
  if (!cvRow?.cv_data) return notFound("CV not found");
  const cv = migrateCvData(cvRow.cv_data);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return ok({ keywords: [], tips: [] });

  const cvSummary = [
    `Skills: ${cv.skills.join(", ") || "(none)"}`,
    `Experience: ${cv.experience.map((e) => `${e.role}: ${e.description}`).join(" | ") || "(none)"}`,
    `Objective: ${cv.objective || "(none)"}`,
  ].join("\n");

  const system = `You help a job seeker tailor their CV to a specific job. Compare the candidate's CV to the job and return ONLY JSON (no prose):
{"keywords": ["up to 8 important skills/keywords the job wants that the CV is MISSING or should emphasize"], "tips": ["2-3 short, specific ways to improve the experience section for THIS job, max 14 words each"]}
Only include keywords genuinely relevant to this job and not already well-covered by the CV.`;

  const userMsg = `CANDIDATE CV:\n${cvSummary}\n\nJOB: ${body.jobTitle ?? ""}\n${body.jobDescription.slice(0, 1500)}\n\nReturn the JSON now.`;

  try {
    const anthropic = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      system,
      messages: [{ role: "user", content: userMsg }],
    });
    const block = resp.content.find((b) => b.type === "text");
    const text = block && block.type === "text" ? block.text : "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) as {
      keywords?: unknown;
      tips?: unknown;
    };
    const keywords = Array.isArray(parsed.keywords)
      ? parsed.keywords.filter((k): k is string => typeof k === "string").slice(0, 8)
      : [];
    const tips = Array.isArray(parsed.tips)
      ? parsed.tips.filter((k): k is string => typeof k === "string").slice(0, 3)
      : [];
    log.info("job improve", { cvId: body.cvId, keywords: keywords.length, tips: tips.length });
    return ok({ keywords, tips });
  } catch (err) {
    logger.warn("job improve failed", { err });
    return ok({ keywords: [], tips: [] });
  }
});
