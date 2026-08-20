"use client";

/**
 * JD Match — paste or upload one job description, pick a CV, get a real match
 * score plus the gaps that produced it, then unlock a rewritten Summary +
 * current role saved as a separate tailored CV.
 *
 * The free half (score, breakdown, missing keywords, ATS issues) is shown in
 * full: it is the part that convinces someone the rewrite is worth paying for.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Crown,
  FileUp,
  Gauge,
  Loader2,
  Lock,
  Sparkles,
  Target,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UpsellModal } from "@/components/UpsellModal";
import { useLanguage } from "@/components/LanguageProvider";
import { useFreeMode } from "@/hooks/useFreeMode";
import { useCurrency } from "@/lib/pricing";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { migrateCvData } from "@/lib/cv/migrate";
import type { JdAnalysis, JdMatchResponse } from "@/types/jd-match";

interface CvOption {
  id: string;
  title: string;
}

/** Ring + number. Colour is the same three-band scale the jobs list uses. */
function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const tone =
    score >= 75 ? "text-green-600" : score >= 50 ? "text-teal" : "text-amber-500";
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="stroke-border"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className={`${tone} transition-[stroke-dashoffset] duration-700`}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className={`text-3xl font-bold ${tone}`}>{score}</span>
      </div>
    </div>
  );
}

function AxisBar({ label, score, note }: { label: string; score: number; note: string }) {
  const tone = score >= 75 ? "bg-green-600" : score >= 50 ? "bg-teal" : "bg-amber-500";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm tabular-nums text-muted-foreground">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${score}%` }} />
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

function MatchInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const { price } = useCurrency();
  const freeMode = useFreeMode();
  const fileInput = useRef<HTMLInputElement>(null);

  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [cvId, setCvId] = useState("");
  const [loading, setLoading] = useState(true);

  const [jobTitle, setJobTitle] = useState("");
  const [jd, setJd] = useState("");
  const [reading, setReading] = useState(false);

  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<JdMatchResponse | null>(null);
  const [applying, setApplying] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rows } = await supabase
        .from("cvs")
        .select("id, title, cv_data")
        .eq("status", "ready")
        .order("updated_at", { ascending: false });

      const options: CvOption[] = (rows ?? []).map((r) => {
        const data = r.cv_data ? migrateCvData(r.cv_data) : null;
        return {
          id: r.id as string,
          title: (r.title as string) || data?.personal.full_name || "My CV",
        };
      });
      setCvs(options);
      const preferred = searchParams.get("cv");
      setCvId(options.find((o) => o.id === preferred)?.id || options[0]?.id || "");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after an error
    if (!file) return;
    setReading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/jobs/jd-extract", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
      if (!res.ok || !data.text) {
        toast.error(data.error ?? t("jd.error"));
        return;
      }
      setJd(data.text);
      toast.success(t("jd.fileRead"));
    } catch {
      toast.error(t("jd.error"));
    } finally {
      setReading(false);
    }
  }

  async function analyse() {
    if (!cvId) {
      toast.error(t("jd.needCv"));
      return;
    }
    if (jd.trim().length < 120) {
      toast.error(t("jd.tooShort"));
      return;
    }
    setAnalysing(true);
    setResult(null);
    try {
      const res = await fetch("/api/jobs/jd-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, jobTitle, jobDescription: jd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error((data as { error?: string }).error ?? t("jd.error"));
        return;
      }
      const payload = data as JdMatchResponse;
      setResult(payload);
      track("jd_match_viewed", { cvId, score: payload.analysis.overallScore });
    } catch {
      toast.error(t("jd.error"));
    } finally {
      setAnalysing(false);
    }
  }

  async function unlock() {
    if (!result || applying) return;
    setApplying(true);
    try {
      const res = await fetch("/api/jobs/jd-match/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: result.matchId }),
      });
      if (res.status === 402) {
        setUpsellOpen(true);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { cvId?: string; error?: string };
      if (!res.ok || !data.cvId) {
        toast.error(data.error ?? t("jd.rewrite.error"));
        return;
      }
      track("jd_match_unlocked", { cvId, matchId: result.matchId });
      toast.success(t("jd.rewrite.done"));
      router.push(`/cv/${data.cvId}`);
    } catch {
      toast.error(t("jd.rewrite.error"));
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  const a: JdAnalysis | null = result?.analysis ?? null;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ms-2 self-start">
        <Link href="/jobs">
          <ArrowLeft className="me-2 h-4 w-4" />
          {t("job.title")}
        </Link>
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
            <Target className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">{t("jd.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("jd.intro")}</p>
      </header>

      {cvs.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-muted-foreground">{t("jd.needCv")}</p>
            <Button asChild className="bg-teal hover:bg-teal-600">
              <Link href="/record">{t("dashboard.create")}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">{t("jd.selectCv")}</span>
                <select
                  value={cvId}
                  onChange={(e) => setCvId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
                >
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-foreground">{t("jd.jobTitle")}</span>
                <Input
                  placeholder={t("jd.jobTitlePlaceholder")}
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                />
              </label>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="font-medium text-foreground">{t("jd.jdLabel")}</span>
              <Textarea
                rows={10}
                placeholder={t("jd.paste")}
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="resize-y"
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={analyse} disabled={analysing} className="bg-teal hover:bg-teal-600">
                {analysing ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Gauge className="me-2 h-4 w-4" />
                )}
                {analysing ? t("jd.analyzing") : t("jd.analyze")}
              </Button>

              <input
                ref={fileInput}
                type="file"
                accept=".pdf,.txt,.md,application/pdf,text/plain"
                onChange={onFile}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={reading || analysing}
              >
                {reading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="me-2 h-4 w-4" />
                )}
                {reading ? t("jd.uploading") : t("jd.upload")}
              </Button>

              <span className="text-xs text-muted-foreground">{t("jd.free")}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysing && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("jd.analyzingLong")}
        </div>
      )}

      {a && result && (
        <div className="space-y-6">
          {/* Score */}
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
              <ScoreRing score={a.overallScore} />
              <div className="min-w-0 flex-1 space-y-2 text-center sm:text-start">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("jd.score")}
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  {t(`jd.verdict.${a.verdict}`)}
                </h2>
                {(a.detectedRole || a.detectedCompany) && (
                  <p className="text-sm text-muted-foreground">
                    {[a.detectedRole, a.detectedCompany].filter(Boolean).join(" · ")}
                  </p>
                )}
                {a.projectedScore > a.overallScore && (
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal-700">
                    <Sparkles className="h-4 w-4" />
                    {t("jd.projected", { score: a.projectedScore })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Breakdown */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <h3 className="font-semibold text-foreground">{t("jd.breakdown")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  ["skills", "experience", "keywords", "seniority", "education"] as const
                ).map((k) => (
                  <AxisBar
                    key={k}
                    label={t(`jd.axis.${k}`)}
                    score={a.breakdown[k].score}
                    note={a.breakdown[k].note}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="font-semibold text-foreground">{t("jd.matched")}</h3>
                {a.matchedKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("jd.matchedNone")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {a.matchedKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-950/50 dark:text-green-200"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-3 p-6">
                <h3 className="font-semibold text-foreground">{t("jd.missing")}</h3>
                {a.missingKeywords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("jd.missingNone")}</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {a.missingKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ATS issues + interview prep */}
          {(a.atsIssues.length > 0 || a.talkingPoints.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {a.atsIssues.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <TriangleAlert className="h-4 w-4 text-amber-500" />
                      {t("jd.ats")}
                    </h3>
                    <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                      {a.atsIssues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {a.talkingPoints.length > 0 && (
                <Card>
                  <CardContent className="space-y-2 p-6">
                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-teal" />
                      {t("jd.talking")}
                    </h3>
                    <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
                      {a.talkingPoints.map((point, i) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* The paywalled rewrite. Hidden when the server couldn't store the
              analysis — without a matchId there is nothing to unlock, and
              offering to charge for it would be a dead end. */}
          {result.matchId && (
          <Card className="border-2 border-amber-300 dark:border-amber-800/60">
            <CardContent className="space-y-4 p-6">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {t("jd.rewrite.title")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{t("jd.rewrite.explain")}</p>
              </div>

              {result.summaryTeaser && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("jd.rewrite.preview")}
                  </p>
                  <p className="text-sm text-foreground">{result.summaryTeaser}</p>
                  {/* Deliberately unreadable filler standing in for the rest of the
                      rewrite — it is never sent to the browser before payment. */}
                  <div aria-hidden className="mt-2 space-y-1.5 select-none blur-sm">
                    <div className="h-2.5 w-full rounded bg-foreground/20" />
                    <div className="h-2.5 w-11/12 rounded bg-foreground/20" />
                    <div className="h-2.5 w-9/12 rounded bg-foreground/20" />
                  </div>
                </div>
              )}

              <button
                onClick={unlock}
                disabled={applying}
                className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-amber-300 bg-card px-4 py-3 text-start transition hover:border-amber-400 disabled:opacity-70"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    {applying ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-500" />
                    ) : (
                      <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                    )}
                    {applying ? t("jd.rewrite.working") : t("jd.rewrite.cta")}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("jd.rewrite.locked", { count: result.lockedCount })}
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1 font-bold text-amber-700">
                  <Crown className="h-4 w-4 text-amber-500" />
                  {freeMode ? "" : price(PREMIUM_PRICE_USD_CENTS)}
                </span>
              </button>
            </CardContent>
          </Card>
          )}
        </div>
      )}

      <UpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={t("jd.upsellTitle")}
        subtitle={t("jd.upsellSubtitle")}
      />
    </div>
  );
}

export default function JdMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      }
    >
      <MatchInner />
    </Suspense>
  );
}
