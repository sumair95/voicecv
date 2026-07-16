"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Pencil, Check, Loader2, Info, Briefcase, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CVPreview } from "@/components/CVPreview";
import { CoverLetterPanel } from "@/components/CoverLetterPanel";
import { getTemplate } from "@/lib/cv/templates";
import { track } from "@/lib/analytics";
import { TemplatePicker } from "@/components/TemplatePicker";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedSave } from "@/hooks/useDebouncedSave";
import type { CVData, CVRecord, TemplateId } from "@/types/cv";
import { DEFAULT_TEMPLATE, EMPTY_CV } from "@/types/cv";
import { migrateCvData } from "@/lib/cv/migrate";

export default function CVDetailPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cv, setCv] = useState<CVRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [coverLetterCredits, setCoverLetterCredits] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("cover_letter_credits, photo_url, photo_formal_url, photo_choice")
        .eq("id", user.id)
        .single();
      setCoverLetterCredits((data?.cover_letter_credits as number) ?? 0);
      // Resolve the profile photo the user chose (formal if picked + available).
      const resolved =
        data?.photo_choice === "formal" && data?.photo_formal_url
          ? (data.photo_formal_url as string)
          : ((data?.photo_url as string | null) ?? null);
      setProfilePhoto(resolved || null);
    })();
  }, [supabase]);

  const fetchCv = useCallback(async () => {
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const record = data as CVRecord;
    if (record.cv_data) {
      record.cv_data = migrateCvData(record.cv_data);
    }
    setCv(record);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchCv();
  }, [fetchCv]);

  // Debounced save that always reads the *latest* cv state inside the
  // timer body — fixes the stale-closure bug where rapid typing across
  // the name + objective fields could save an old title.
  const scheduleSave = useDebouncedSave<CVData>(async (updated) => {
    const fallbackTitle = updated.personal?.full_name || cv?.title || "My CV";
    const { error } = await supabase
      .from("cvs")
      .update({
        cv_data: updated,
        title: fallbackTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error("Save failed: " + error.message);
      return;
    }
    // Record the (AI original -> human-approved final) pair for edit-diff
    // learning. Fire-and-forget — never block or surface errors to the editor.
    void fetch("/api/cv/log-edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvId: id }),
    }).catch(() => {});
  });

  function handleChange(updated: CVData) {
    setCv((prev) => (prev ? { ...prev, cv_data: updated } : prev));
    scheduleSave(updated);
  }

  // Pull the user's saved profile details into this CV's personal fields
  // (profile values win where present). Lets a user update city/phone/etc. once
  // on their profile and push it into whichever CV they choose.
  async function applyProfile() {
    if (!cv || !cv.cv_data) return;
    const cvData = cv.cv_data;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, email, phone, city, country, nationality")
      .eq("id", user.id)
      .single();
    const hasAny =
      prof &&
      (prof.full_name || prof.email || prof.phone || prof.city || prof.country || prof.nationality);
    if (!hasAny) {
      toast.error(t("profile.applyEmpty"));
      return;
    }
    const p = cvData.personal ?? {};
    handleChange({
      ...cvData,
      personal: {
        ...p,
        full_name: prof.full_name || p.full_name || "",
        email: prof.email || p.email || "",
        phone: prof.phone || p.phone || "",
        city: prof.city || p.city || "",
        country: prof.country || p.country || "",
        nationality: prof.nationality || p.nationality || "",
      },
    });
    toast.success(t("profile.applied"));
  }

  // Opt-in photo on this CV. ON copies the profile photo into the CV; OFF clears
  // it. Per-CV — never affects other CVs. Off by default.
  const photoOn = !!cv?.cv_data?.personal?.photo_url;
  function togglePhoto() {
    if (!cv?.cv_data) return;
    if (photoOn) {
      handleChange({
        ...cv.cv_data,
        personal: { ...cv.cv_data.personal, photo_url: "" },
      });
      return;
    }
    if (!profilePhoto) {
      toast.error(t("cv.photoNeedProfile"));
      return;
    }
    handleChange({
      ...cv.cv_data,
      personal: { ...cv.cv_data.personal, photo_url: profilePhoto },
    });
  }

  async function changeTemplate(next: TemplateId) {
    // Premium templates need a credit: spend one (unless this CV is already
    // unlocked) before switching. Server-side gating enforces this too.
    if (getTemplate(next).premium && cv && !cv.premium_unlocked) {
      const res = await fetch("/api/unlock-cv-premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: id }),
      });
      if (res.status === 402) {
        toast.error(t("premium.needCvCredit"));
        return;
      }
      if (!res.ok) {
        toast.error(t("premium.unlockError"));
        return;
      }
      setCv((prev) => (prev ? { ...prev, premium_unlocked: true } : prev));
    }

    setCv((prev) => (prev ? { ...prev, template: next } : prev));
    const { error } = await supabase
      .from("cvs")
      .update({ template: next, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Template change failed: " + error.message);
  }

  async function downloadPdf() {
    if (!cv) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: id }),
      });
      if (!res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        let detail = `HTTP ${res.status}`;
        if (ct.includes("application/json")) {
          const data = await res.json().catch(() => null);
          if (data?.error) detail = String(data.error);
        } else {
          const text = await res.text().catch(() => "");
          if (text) detail = text.slice(0, 200);
        }
        console.error("[downloadPdf] server error:", detail);
        throw new Error(detail);
      }
      const blob = await res.blob();
      if (blob.size === 0) throw new Error("PDF was empty");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.cv_data?.personal?.full_name || "CV"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      track("pdf_downloaded", { kind: "cv", cvId: id, template: cv.template });
      toast.success("PDF downloaded");
    } catch (err) {
      console.error("[downloadPdf]", err);
      toast.error(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal" />
      </div>
    );
  }

  if (!cv || !cv.cv_data) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-muted-foreground">
          {cv?.status === "processing"
            ? t("status.processing")
            : "CV not found or still being prepared."}
        </p>
        <Button onClick={() => fetchCv()} variant="outline">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const cvData = cv.cv_data ?? EMPTY_CV;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t("dashboard.myCvs")}
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/jobs?cv=${id}`}>
              <Briefcase className="me-2 h-4 w-4" />
              {t("cv.findJobs")}
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? (
              <>
                <Check className="me-2 h-4 w-4" />
                {t("cv.done")}
              </>
            ) : (
              <>
                <Pencil className="me-2 h-4 w-4" />
                {t("cv.edit")}
              </>
            )}
          </Button>
          {editing && (
            <Button variant="outline" onClick={applyProfile}>
              <UserRound className="me-2 h-4 w-4" />
              {t("profile.applyToCv")}
            </Button>
          )}
          <Button
            onClick={downloadPdf}
            disabled={downloading}
            className="bg-teal hover:bg-teal-600"
          >
            {downloading ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="me-2 h-4 w-4" />
            )}
            {t("cv.download")}
          </Button>
        </div>
      </div>

      {editing && (
        <div className="no-print flex items-start gap-2 rounded-xl border border-teal/30 bg-teal/5 px-4 py-3 text-sm text-teal-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t("edit.banner")}</span>
        </div>
      )}

      <TemplatePicker
        value={(cv.template as TemplateId | null) ?? DEFAULT_TEMPLATE}
        onChange={changeTemplate}
        premiumEnabled
      />

      {editing && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <div className="flex items-center gap-3">
            {photoOn && profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profilePhoto}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-muted text-muted-foreground">
                <UserRound className="h-5 w-5" />
              </span>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{t("cv.photoToggle")}</p>
              <p className="text-xs text-muted-foreground">
                {profilePhoto ? (
                  t("cv.photoHint")
                ) : (
                  <>
                    {t("cv.photoNeedProfile")}{" "}
                    <Link href="/profile" className="text-teal-600 underline">
                      {t("cv.photoGoProfile")}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            role="switch"
            aria-checked={photoOn}
            onClick={togglePhoto}
            disabled={!profilePhoto && !photoOn}
            className={`relative h-7 w-12 shrink-0 rounded-full ring-1 ring-inset ring-black/10 transition disabled:opacity-40 ${
              photoOn ? "bg-teal" : "bg-navy-300"
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${
                photoOn ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      )}

      <CVPreview
        cvData={cvData}
        language={cv.language ?? "en"}
        editable={editing}
        onChange={handleChange}
        template={(cv.template as TemplateId | null) ?? DEFAULT_TEMPLATE}
      />

      <CoverLetterPanel
        cvId={id}
        initialLetter={cv.cover_letter}
        name={cv.cv_data?.personal?.full_name || cv.title || "CV"}
        coverLetterCredits={coverLetterCredits}
        coverLetterUnlocked={cv.cover_letter_unlocked ?? false}
      />
    </div>
  );
}
