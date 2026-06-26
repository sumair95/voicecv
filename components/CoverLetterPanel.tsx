"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Download, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

// Premium cover-letter panel on the CV page. Generation is gated server-side:
// the first letter for a CV spends a cover-letter credit; regenerating/editing
// the same CV's letter is free.
export function CoverLetterPanel({
  cvId,
  initialLetter,
  name,
}: {
  cvId: string;
  initialLetter: string | null;
  name: string;
}) {
  const { t } = useLanguage();
  const supabase = useMemo(() => createClient(), []);
  const [letter, setLetter] = useState(initialLetter ?? "");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, targetRole: role, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        toast.error(t("letter.needPremium"));
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? t("letter.error"));
        return;
      }
      setLetter(data.coverLetter as string);
    } catch {
      toast.error(t("letter.error"));
    } finally {
      setGenerating(false);
    }
  }

  async function saveEdits() {
    setSaving(true);
    const { error } = await supabase
      .from("cvs")
      .update({ cover_letter: letter, updated_at: new Date().toISOString() })
      .eq("id", cvId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("letter.saved"));
  }

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch("/api/export-cover-letter-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name || "cover_letter"}_cover_letter.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("dashboard.download.error"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="no-print border-amber-200/70">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-400 text-white">
            <FileText className="h-4 w-4" />
          </span>
          <h2 className="text-lg font-bold text-navy-900">{t("letter.title")}</h2>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
            {t("letter.badge")}
          </span>
        </div>

        {!letter && !generating && (
          <>
            <p className="text-sm text-navy-400">{t("letter.intro")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder={t("letter.targetRole")}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
              <Input
                placeholder={t("letter.company")}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <Button onClick={generate} className="bg-amber-500 text-white hover:bg-amber-600">
              <Sparkles className="me-2 h-4 w-4" />
              {t("letter.generate")}
            </Button>
          </>
        )}

        {generating && (
          <div className="flex items-center gap-2 py-4 text-navy-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t("letter.generating")}
          </div>
        )}

        {letter && !generating && (
          <>
            <textarea
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              rows={14}
              className="w-full resize-y rounded-lg border border-navy-100 p-3 text-sm leading-relaxed text-navy-700 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
            />
            <div className="flex flex-wrap gap-2">
              <Button onClick={download} disabled={downloading} className="bg-teal hover:bg-teal-600">
                {downloading ? (
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="me-2 h-4 w-4" />
                )}
                {t("letter.download")}
              </Button>
              <Button onClick={saveEdits} disabled={saving} variant="outline">
                {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
              <Button onClick={generate} variant="outline">
                <RefreshCw className="me-2 h-4 w-4" />
                {t("letter.regenerate")}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
