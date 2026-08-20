/**
 * JD Match — paste or upload a job description, score the CV against it, and
 * rewrite the Summary + current role to target it. Client-safe (type-only).
 */

/** How the overall score reads at a glance. */
export type JdVerdict = "strong" | "promising" | "stretch";

/** One axis of the score, 0-100, with a one-line justification. */
export interface JdAxis {
  score: number;
  note: string;
}

export interface JdBreakdown {
  /** Hard/technical skills the posting asks for vs. the CV. */
  skills: JdAxis;
  /** Relevance and depth of the actual work history. */
  experience: JdAxis;
  /** Literal ATS keyword coverage (exact terms the parser looks for). */
  keywords: JdAxis;
  /** Level/scope fit — junior vs senior, team size, ownership. */
  seniority: JdAxis;
  /** Degrees, certifications, licences the posting requires. */
  education: JdAxis;
}

/** One rewritten experience entry. `index` is the position in `cv.experience`. */
export interface JdTailoredExperience {
  index: number;
  role: string;
  description: string;
}

/**
 * The rewrite the model proposes. Held server-side until the user unlocks it —
 * only `tailoredSummaryTeaser` is sent to a non-premium client.
 */
export interface JdDraft {
  tailoredJobTitle: string;
  tailoredSummary: string;
  tailoredExperience: JdTailoredExperience[];
  prioritisedSkills: string[];
}

/** The free half of the analysis — always safe to return to the client. */
export interface JdAnalysis {
  overallScore: number;
  /** Score the CV would reach if the rewrite is applied. */
  projectedScore: number;
  verdict: JdVerdict;
  breakdown: JdBreakdown;
  /** Terms from the posting the CV already covers. */
  matchedKeywords: string[];
  /** Terms the posting wants that the CV is missing or under-states. */
  missingKeywords: string[];
  /** Concrete ATS/formatting problems for THIS posting. */
  atsIssues: string[];
  /** Points to raise in an interview, drawn only from real CV facts. */
  talkingPoints: string[];
  detectedRole: string;
  detectedCompany: string;
}

/** Full model output = the free analysis + the gated rewrite. */
export interface JdMatchResult extends JdAnalysis {
  draft: JdDraft;
}

/** What POST /api/jobs/jd-match returns. */
export interface JdMatchResponse {
  matchId: string;
  analysis: JdAnalysis;
  /** First sentence of the rewritten summary — the free teaser. */
  summaryTeaser: string;
  /** How many rewritten blocks are waiting behind the paywall. */
  lockedCount: number;
  /** True when the rewrite is already paid for (or the account is comped). */
  unlocked: boolean;
  /** Present only when `unlocked` — the full rewrite. */
  draft?: JdDraft;
}

/** A persisted analysis (see migration 028). */
export interface JdMatchRecord {
  id: string;
  user_id: string;
  cv_id: string | null;
  /** CV created by applying the rewrite, once the user unlocks it. */
  tailored_cv_id: string | null;
  job_title: string;
  company: string;
  jd_text: string;
  overall_score: number;
  projected_score: number | null;
  analysis: JdAnalysis;
  draft: JdDraft;
  unlocked: boolean;
  created_at: string;
}
