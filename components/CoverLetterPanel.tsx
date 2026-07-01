"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Download, Sparkles, RefreshCw, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/analytics";
import { useCurrency } from "@/lib/pricing";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";

// Cover-letter panel on the CV page. Generation + viewing are FREE for everyone;
// DOWNLOAD (and editing) require Premium. Free users see the full letter as a
// read-only, non-selectable preview to nudge the upgrade.
export function CoverLetterPanel({
  cvId,
  initialLetter,
  name,
  coverLetterCredits,
  coverLetterUnlocked,
}: {
  cvId: string;
  initialLetter: string | null;
  name: string;
  coverLetterCredits: number;
  coverLetterUnlocked: boolean;
}) {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const supabase = useMemo(() => createClient(), []);
  const [letter, setLetter] = useState(initialLetter ?? "");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(coverLetterUnlocked);

  // Entitled to download + edit: this CV's letter is unlocked, or the user
  // holds a cover-letter credit to spend on download.
  const entitled = unlocked || coverLetterCredits > 0;

  async function buyPremium() {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack: "premium" }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error(data.error ?? t("premium.checkoutError"));
    } catch {
      toast.error(t("premium.checkoutError"));
    }
  }

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId, targetRole: role, company }),
      });
      const data = await res.json().catch(() => ({}));
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
      if (res.status === 402) {
        toast.error(t("letter.downloadLocked.desc"));
        buyPremium();
        return;
      }
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
      setUnlocked(true); // first paid download unlocks the CV
      track("pdf_downloaded", { kind: "cover_letter", cvId });
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

        {/* Generate form (free for everyone) */}
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

        {/* Result — editable for entitled users, read-only preview otherwise */}
        {letter && !generating && (
          <>
            {entitled ? (
              <textarea
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                rows={16}
                className="w-full resize-y rounded-lg border border-navy-100 p-4 text-sm leading-relaxed text-navy-700 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40"
              />
            ) : (
              <div
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                className="select-none whitespace-pre-wrap rounded-lg border border-navy-100 bg-navy-50/30 p-4 text-sm leading-relaxed text-navy-700"
              >
                <div className="mb-3 border-b border-navy-100 pb-2 text-base font-bold text-teal-700">
                  {name}
                </div>
                {letter}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {entitled ? (
                <>
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
                </>
              ) : (
                <Button onClick={buyPremium} className="bg-amber-500 text-white hover:bg-amber-600">
                  <Lock className="me-2 h-4 w-4" />
                  {t("letter.downloadLocked.cta", { price: price(PREMIUM_PRICE_USD_CENTS) })}
                </Button>
              )}
              <Button onClick={generate} variant="outline">
                <RefreshCw className="me-2 h-4 w-4" />
                {t("letter.regenerate")}
              </Button>
            </div>

            {!entitled && (
              <p className="flex items-center gap-1.5 text-xs text-navy-400">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                {t("letter.downloadLocked.desc")}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
