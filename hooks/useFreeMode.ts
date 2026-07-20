"use client";

import { useEffect, useState } from "react";

// Short-lived cache to dedupe fetches across components on the same page, while
// still picking up an /admin payment-toggle change quickly.
let cachedVal = false;
let cachedAt = 0;
const TTL_MS = 8_000;

/**
 * Whether "free mode" is on (testing/submission window): all premium features
 * are free and pricing should be hidden. Reads /api/stats (free_mode is served
 * fresh there). Fails safe to `false` (pricing shown) if unreachable.
 */
export function useFreeMode(): boolean {
  const [free, setFree] = useState(cachedVal);
  useEffect(() => {
    if (Date.now() - cachedAt < TTL_MS) {
      setFree(cachedVal);
      return;
    }
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        cachedVal = Boolean(d?.freeMode);
        cachedAt = Date.now();
        if (!cancelled) setFree(cachedVal);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return free;
}
