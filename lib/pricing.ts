"use client";

import { useEffect, useState } from "react";

/**
 * Regional price DISPLAY. The real charge + FX is done by Stripe Adaptive
 * Pricing at checkout (enabled in the Stripe Dashboard), so these rates are
 * INDICATIVE only — they just make our own pages feel local. They don't need
 * to be exact and aren't financially binding; the "≈" prefix signals that.
 *
 * Region is detected from the browser timezone — no geo-IP call, no API key,
 * no latency, no extra dependency. Good enough for a display hint; Stripe uses
 * the customer's actual card/location for the real amount.
 */
export type Currency = "USD" | "PKR" | "INR" | "SAR";

/** Indicative price for the AI "formal photo" conversion (paid add-on). */
export const FORMAL_PHOTO_USD_CENTS = 200;

interface CurrencyInfo {
  symbol: string;
  rate: number; // indicative USD -> currency (≈ mid-2026)
  step: number; // round the displayed amount to the nearest this
  approx: boolean;
}

const CURRENCIES: Record<Currency, CurrencyInfo> = {
  USD: { symbol: "$", rate: 1, step: 1, approx: false },
  PKR: { symbol: "₨", rate: 278, step: 50, approx: true },
  INR: { symbol: "₹", rate: 83, step: 10, approx: true },
  SAR: { symbol: "﷼", rate: 3.75, step: 1, approx: true }, // SAR is USD-pegged
};

// Timezone → currency. Pakistan → PKR, India → INR, Saudi Arabia → SAR,
// everything else → USD.
const TZ_TO_CURRENCY: Record<string, Currency> = {
  "Asia/Karachi": "PKR",
  "Asia/Kolkata": "INR",
  "Asia/Calcutta": "INR",
  "Asia/Riyadh": "SAR",
};

export function detectCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TZ_TO_CURRENCY[tz] ?? "USD";
  } catch {
    return "USD";
  }
}

export function formatPrice(usdCents: number, currency: Currency): string {
  const info = CURRENCIES[currency];
  if (currency === "USD") {
    const dollars = usdCents / 100;
    return `$${Number.isInteger(dollars) ? dollars : dollars.toFixed(2)}`;
  }
  const raw = (usdCents / 100) * info.rate;
  const rounded = Math.max(info.step, Math.round(raw / info.step) * info.step);
  return `${info.approx ? "≈ " : ""}${info.symbol}${rounded.toLocaleString("en-US")}`;
}

/**
 * Client hook. Renders USD on first paint (SSR-safe, no hydration mismatch),
 * then switches to the detected local currency after mount.
 */
export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");
  useEffect(() => setCurrency(detectCurrency()), []);
  return {
    currency,
    price: (usdCents: number) => formatPrice(usdCents, currency),
  };
}
