"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Download, Pencil, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CVPreview } from "@/components/CVPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import type { CVData, CVRecord } from "@/types/cv";
import { EMPTY_CV } from "@/types/cv";

export default function CVDetailPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [cv, setCv] = useState<CVRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCv = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("cvs")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setCv(data as CVRecord);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchCv();
  }, [fetchCv]);

  function handleChange(updated: CVData) {
    setCv((prev) => (prev ? { ...prev, cv_data: updated } : prev));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from("cvs")
        .update({
          cv_data: updated,
          title: updated.personal?.full_name || cv?.title || "My CV",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) toast.error("Save failed: " + error.message);
    }, 1000);
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
      if (!res.ok) throw new Error("PDF generation failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${cv.cv_data?.personal?.full_name || "CV"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded");
    } catch (err) {
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

      <CVPreview
        cvData={cvData}
        language={lang}
        editable={editing}
        onChange={handleChange}
      />
    </div>
  );
}
