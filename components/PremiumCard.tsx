"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageProvider";
import { useFreeMode } from "@/hooks/useFreeMode";
import { useCurrency } from "@/lib/pricing";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";

// Dashboard upsell + credit balance. The button opens Stripe Checkout; credits
// are granted only by the webhook after payment, then shown here on next load.
export function PremiumCard({
  cvCredits,
  letterCredits,
}: {
  cvCredits: number;
  letterCredits: number;
}) {
  const { t } = useLanguage();
  const { price } = useCurrency();
  const [loading, setLoading] = useState(false);
  const freeMode = useFreeMode();
  const hasCredits = cvCredits > 0 || letterCredits > 0;

  // While pricing is parked (testing/submission), hide the upsell entirely.
  if (freeMode) return null;

  async function buy() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url as string;
        return;
      }
      toast.error(data.error ?? t("premium.checkoutError"));
    } catch {
      toast.error(t("premium.checkoutError"));
    }
    setLoading(false);
  }

  return (
    <Card className="overflow-hidden border-amber-200/70 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-card">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-400 text-white">
              <Crown className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold text-foreground">{t("premium.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("premium.tagline", { price: price(PREMIUM_PRICE_USD_CENTS) })}
          </p>
          {hasCredits && (
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {cvCredits} {t("premium.cvCredits")}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {letterCredits} {t("premium.letterCredits")}
              </span>
            </div>
          )}
        </div>
        <Button
          onClick={buy}
          disabled={loading}
          className="shrink-0 bg-amber-500 text-white hover:bg-amber-600"
        >
          {loading ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Crown className="me-2 h-4 w-4" />
          )}
          {t("premium.cta", { price: price(PREMIUM_PRICE_USD_CENTS) })}
        </Button>
      </CardContent>
    </Card>
  );
}
