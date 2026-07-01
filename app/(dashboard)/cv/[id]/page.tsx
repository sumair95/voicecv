"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Pencil, Check, Loader2, Info } from "lucide-react";
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
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("cover_letter_credits")
        .eq("id", user.id)
        .single();
      setCoverLetterCredits((data?.cover_letter_credits as number) ?? 0);
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
    if (error) toast.error("Save failed: " + error.message);
  });

  function handleChange(updated: CVData) {
    setCv((prev) => (prev ? { ...prev, cv_data: updated } : prev));
    scheduleSave(updated);
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
        <p className="text-navy-400">
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
