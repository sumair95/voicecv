"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Fire-and-forget client analytics. Writes one row to the `events` table.
 * Never throws and never blocks the UI — analytics must not break the product.
 * Read the funnel with SQL (see ANALYTICS.md).
 */
export function track(event: string, props: Record<string, unknown> = {}) {
  void (async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase.from("events").insert({
        user_id: user?.id ?? null,
        event,
        props,
      });
    } catch {
      // swallow — analytics is best-effort
    }
  })();
}
