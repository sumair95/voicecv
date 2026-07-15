"use client";

/**
 * Low-match (<55%) "improve your CV for this job" panel. Fetches missing
 * keywords + tips on demand, shows a couple as a teaser, blurs the rest, and
 * upsells the $5 Premium (professional CV rewrite + cover letter).
 */

import { useState } from "react";
import { Sparkles, Lock, Loader2, Crown } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useCurrency } from "@/lib/pricing";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";
import type { JobListing } from "@/types/jobs";

export function JobImprovePanel({
  cvId,
  job,
  onUpsell,
}: {
  cvId: string;
  job: JobListing;
  onUpsell: () => void;
}) {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ keywords: string[]; tips: string[] } | null>(null);

  async function reveal() {
    if (loading || data) return;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cvId,
          jobTitle: job.title,
          jobDescription: job.description,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        keywords?: string[];
        tips?: string[];
      };
      setData({ keywords: json.keywords ?? [], tips: json.tips ?? [] });
    } finally {
      setLoading(false);
    }
  }

  const kw = data?.keywords ?? [];
  const tips = data?.tips ?? [];
  const teaser = kw.slice(0, 2);
  const hidden = kw.slice(2);
  const lockedCount = hidden.length + tips.length;

  return (
    <div className="border-t border-amber-200 bg-amber-50/60 px-5 py-3">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <Sparkles className="h-4 w-4" />
        {t("job.improve.title")}
      </div>

      {!data ? (
        <button
          onClick={reveal}
          disabled={loading}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:underline disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("job.improve.cta")}
        </button>
      ) : kw.length === 0 && tips.length === 0 ? (
        <p className="mt-1 text-sm text-navy-400">{t("job.improve.none")}</p>
      ) : (
        <div className="mt-2 space-y-2.5">
          <p className="text-xs text-navy-500">{t("job.improve.addKeywords")}</p>
          <div className="flex flex-wrap gap-1.5">
            {teaser.map((k, i) => (
              <span
                key={`t${i}`}
                className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-100"
              >
                {k}
              </span>
            ))}
            {hidden.map((k, i) => (
              <span
                key={`h${i}`}
                aria-hidden
                className="pointer-events-none select-none rounded-full bg-white px-2.5 py-1 text-xs font-medium text-navy-700 ring-1 ring-navy-100 blur-sm"
              >
                {k}
              </span>
            ))}
          </div>

          <button
            onClick={onUpsell}
            className="flex w-full items-center justify-between gap-2 rounded-lg border-2 border-amber-300 bg-white px-4 py-3 text-start transition hover:border-amber-400"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-navy-900">
                <Lock className="h-4 w-4 shrink-0 text-amber-500" />
                {t("job.improve.unlock")}
              </span>
              {lockedCount > 0 && (
                <span className="mt-0.5 block text-xs text-navy-400">
                  {t("job.improve.locked", { count: lockedCount })}
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-center gap-1 font-bold text-amber-700">
              <Crown className="h-4 w-4 text-amber-500" />
              {price(PREMIUM_PRICE_USD_CENTS)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
