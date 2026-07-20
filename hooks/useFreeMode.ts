"use client";

import { useEffect, useState } from "react";

// Module-level cache so we only hit /api/stats once per page load.
let cached: boolean | null = null;

/**
 * Whether "free mode" is on (testing/submission window): all premium features
 * are free and pricing should be hidden. Reads /api/stats (cached). Fails safe
 * to `false` (pricing shown) if unreachable.
 */
export function useFreeMode(): boolean {
  const [free, setFree] = useState(cached ?? false);
  useEffect(() => {
    if (cached !== null) {
      setFree(cached);
      return;
    }
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => {
        cached = Boolean(d?.freeMode);
        if (!cancelled) setFree(cached);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return free;
}
