"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Briefcase,
  Loader2,
  MapPin,
  Search,
  ExternalLink,
  Bookmark,
  Trash2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UpsellModal } from "@/components/UpsellModal";
import { JobImprovePanel } from "@/components/JobImprovePanel";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { migrateCvData } from "@/lib/cv/migrate";
import type { JobApplication, JobListing, JobStatus } from "@/types/jobs";
import { JOB_STATUSES } from "@/types/jobs";

interface CvOption {
  id: string;
  title: string;
  role: string;
  location: string;
}

const STATUS_STYLES: Record<JobStatus, string> = {
  saved: "bg-muted text-foreground",
  applied: "bg-teal/15 text-teal-700",
  interview: "bg-amber-100 text-amber-700",
  offer: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

function JobsInner() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [cvs, setCvs] = useState<CvOption[]>([]);
  const [cvId, setCvId] = useState<string>("");
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);

  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<JobListing[]>([]);
  const [searched, setSearched] = useState(false);

  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Which listing ids are already tracked (so we can show status inline).
  const trackedById = useMemo(
    () => new Map(apps.map((a) => [a.external_job_id, a])),
    [apps],
  );

  // Load the user's CVs (for the picker + default role/location) and their apps.
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: cvRows }, { data: appRows }] = await Promise.all([
        supabase
          .from("cvs")
          .select("id, title, cv_data")
          .eq("status", "ready")
          .order("updated_at", { ascending: false }),
        supabase
          .from("job_applications")
          .select("*")
          .order("updated_at", { ascending: false }),
      ]);

      const options: CvOption[] = (cvRows ?? []).map((r) => {
        const data = r.cv_data ? migrateCvData(r.cv_data) : null;
        const role = data?.experience.find((e) => e.role?.trim())?.role ?? "";
        const loc = data
          ? [data.personal.city, data.personal.country].filter(Boolean).join(", ")
          : "";
        return {
          id: r.id as string,
          title: (r.title as string) || data?.personal.full_name || "My CV",
          role,
          location: loc,
        };
      });
      setCvs(options);
      setApps((appRows as JobApplication[]) ?? []);

      // Default selection: ?cv= param, else the most recent CV.
      const preferred = searchParams.get("cv");
      const chosen =
        options.find((o) => o.id === preferred)?.id || options[0]?.id || "";
      if (chosen) applyCvDefaults(chosen, options);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function applyCvDefaults(id: string, options: CvOption[]) {
    setCvId(id);
    const opt = options.find((o) => o.id === id);
    if (opt) {
      setRole((prev) => prev || opt.role);
      setLocation((prev) => prev || opt.location);
    }
  }

  async function search() {
    if (!cvId) {
      toast.error(t("job.needCv"));
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, query: role, location, remoteOnly }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? t("job.error"));
        setResults([]);
        return;
      }
      setResults((data.jobs as JobListing[]) ?? []);
    } catch {
      toast.error(t("job.error"));
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  // Save or apply a listing → upsert a tracker row. `apply` also opens the
  // employer's apply page in a new tab.
  const saveJob = useCallback(
    async (job: JobListing, status: JobStatus) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const row = {
        user_id: user.id,
        cv_id: cvId || null,
        external_job_id: job.id,
        source: job.source,
        title: job.title,
        company: job.company,
        location: job.location,
        apply_url: job.applyUrl,
        logo: job.logo,
        salary_text: job.salaryText,
        match_score: job.score ?? null,
        match_reason: job.reason ?? null,
        status,
        applied_at: status === "applied" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("job_applications")
        .upsert(row, { onConflict: "user_id,external_job_id" })
        .select()
        .single();
      if (error) {
        toast.error(error.message);
        return;
      }

      const saved = data as JobApplication;
      setApps((prev) => [saved, ...prev.filter((a) => a.id !== saved.id)]);
      track(status === "applied" ? "job_applied" : "job_saved", {
        cvId,
        jobId: job.id,
        score: job.score,
      });
      toast.success(status === "applied" ? t("job.status.applied") : t("job.status.saved"));
    },
    [cvId, supabase, t],
  );

  async function apply(job: JobListing) {
    // Open the employer's page first (must be inside the click to avoid popup block).
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    await saveJob(job, "applied");
  }

  async function updateStatus(app: JobApplication, status: JobStatus) {
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status } : a)),
    );
    const { error } = await supabase
      .from("job_applications")
      .update({
        status,
        applied_at:
          status === "applied" && !app.applied_at
            ? new Date().toISOString()
            : app.applied_at,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);
    if (error) toast.error(error.message);
    else track("job_status_changed", { jobId: app.external_job_id, status });
  }

  async function removeApp(app: JobApplication) {
    setApps((prev) => prev.filter((a) => a.id !== app.id));
    const { error } = await supabase.from("job_applications").delete().eq("id", app.id);
    if (error) toast.error(error.message);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="-ms-2 self-start">
        <Link href="/dashboard">
          <ArrowLeft className="me-2 h-4 w-4" />
          {t("dashboard.myCvs")}
        </Link>
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
            <Briefcase className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-bold text-foreground">{t("job.title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("job.intro")}</p>
      </header>

      {cvs.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <p className="text-muted-foreground">{t("job.needCv")}</p>
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
                <span className="font-medium text-foreground">{t("job.selectCv")}</span>
                <select
                  value={cvId}
                  onChange={(e) => applyCvDefaults(e.target.value, cvs)}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
                >
                  {cvs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border text-teal focus:ring-teal"
                />
                {t("job.remoteOnly")}
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder={t("job.role")}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <Input
                placeholder={t("job.location")}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button
              onClick={search}
              disabled={searching}
              className="bg-teal hover:bg-teal-600"
            >
              {searching ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="me-2 h-4 w-4" />
              )}
              {t("job.find")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searching && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t("job.searching")}
        </div>
      )}

      {!searching && searched && results.length === 0 && (
        <p className="text-muted-foreground">{t("job.noResults")}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((job) => {
            const tracked = trackedById.get(job.id);
            return (
              <Card key={job.id} className="overflow-hidden">
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <h3 className="font-semibold text-foreground">{job.title}</h3>
                      {typeof job.score === "number" && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            job.score >= 80
                              ? "bg-green-100 text-green-700"
                              : job.score >= 50
                                ? "bg-teal/15 text-teal-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t("job.matchScore", { score: job.score })}
                        </span>
                      )}
                    </div>
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {job.company || "—"}
                      </span>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                      )}
                      {job.salaryText && (
                        <span className="font-medium text-foreground">{job.salaryText}</span>
                      )}
                    </p>
                    {job.reason && (
                      <p className="text-sm italic text-teal-700">“{job.reason}”</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {tracked ? (
                      <span
                        className={`self-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[tracked.status]}`}
                      >
                        {t(`job.status.${tracked.status}`)}
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => saveJob(job, "saved")}
                      >
                        <Bookmark className="me-1.5 h-4 w-4" />
                        {t("job.save")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      className="bg-teal hover:bg-teal-600"
                      onClick={() => apply(job)}
                    >
                      <ExternalLink className="me-1.5 h-4 w-4" />
                      {t("job.apply")}
                    </Button>
                  </div>
                </CardContent>
                {typeof job.score === "number" && job.score < 55 && cvId && (
                  <JobImprovePanel
                    cvId={cvId}
                    job={job}
                    onUpsell={() => setUpsellOpen(true)}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Application tracker */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t("job.tracked")}</h2>
        {apps.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("job.trackedEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {apps.map((app) => (
              <Card key={app.id}>
                <CardContent className="flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{app.title}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {[app.company, app.location].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => updateStatus(app, e.target.value as JobStatus)}
                    className={`rounded-full border-0 px-3 py-1 text-xs font-semibold focus:ring-2 focus:ring-teal/40 ${STATUS_STYLES[app.status]}`}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`job.status.${s}`)}
                      </option>
                    ))}
                  </select>
                  {app.apply_url && (
                    <Button asChild variant="ghost" size="sm">
                      <a href={app.apply_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeApp(app)}
                    aria-label={t("job.remove")}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <UpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        title={t("job.improve.upsellTitle")}
        subtitle={t("job.improve.upsellSubtitle")}
      />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
        </div>
      }
    >
      <JobsInner />
    </Suspense>
  );
}
