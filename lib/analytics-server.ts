import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side event logging (route handlers / webhook). Best-effort: never
 * throws, so a failed insert can't break the request it's measuring.
 */
export async function logEvent(
  supabase: SupabaseClient,
  userId: string | null,
  event: string,
  props: Record<string, unknown> = {},
) {
  try {
    await supabase.from("events").insert({ user_id: userId, event, props });
  } catch {
    // swallow — analytics is best-effort
  }
}
