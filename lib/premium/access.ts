/**
 * Comp (complimentary) access check.
 *
 * A user is "comped" when the master switch is ON *and* their email is on the
 * allowlist (see migration 020 + /admin). Comped users get every premium action
 * for free: no credit spent, no Stripe. Everyone else is charged as normal.
 *
 * Reads through the SECURITY DEFINER `is_comp_account()` RPC using the caller's
 * own (RLS-bound) client, so it can only ever report on the current user.
 * Best-effort: any error resolves to `false` (charge as normal) — comp must
 * never be granted by accident.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export async function isCompAccount(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("is_comp_account");
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
