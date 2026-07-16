"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { useCurrency } from "@/lib/pricing";
import {
  type PackId,
  CV_PACK_PRICE_USD_CENTS,
  PREMIUM_PRICE_USD_CENTS,
} from "@/lib/premium";

// Shown when a free user hits the CV limit (or wants more credits). Offers the
// $3 CV pack or the $5 Premium pack; both open Stripe Checkout.
export function UpsellModal({
  open,
  onClose,
  title,
  subtitle,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}) {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const [loading, setLoading] = useState<PackId | null>(null);

  if (!open) return null;

  async function buy(pack: PackId) {
    setLoading(pack);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
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
    setLoading(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-navy-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">{title ?? t("upsell.title")}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.cancel")}
            className="text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle ?? t("upsell.subtitle")}</p>

        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => buy("cv")}
            disabled={!!loading}
            className="flex w-full items-center justify-between rounded-xl border border-border p-4 text-start transition hover:border-teal/50 hover:bg-teal/5 disabled:opacity-60"
          >
            <div>
              <div className="font-semibold text-foreground">{t("upsell.cv.title")}</div>
              <div className="text-xs text-muted-foreground">{t("upsell.cv.desc")}</div>
            </div>
            <span className="flex items-center gap-1 font-bold text-teal-700">
              {loading === "cv" && <Loader2 className="h-4 w-4 animate-spin" />}
              {price(CV_PACK_PRICE_USD_CENTS)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => buy("premium")}
            disabled={!!loading}
            className="flex w-full items-center justify-between rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-start transition hover:border-amber-400 disabled:opacity-60 dark:border-amber-800/60 dark:bg-amber-950/30"
          >
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Crown className="h-4 w-4 text-amber-500" />
                {t("premium.title")}
              </div>
              <div className="text-xs text-muted-foreground">{t("upsell.premium.desc")}</div>
            </div>
            <span className="flex items-center gap-1 font-bold text-amber-700">
              {loading === "premium" && <Loader2 className="h-4 w-4 animate-spin" />}
              {price(PREMIUM_PRICE_USD_CENTS)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
