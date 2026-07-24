import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, unauthorized } from "@/lib/api/respond";
import { isCompAccount } from "@/lib/premium/access";
import { createAdminClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/analytics-server";

export const runtime = "nodejs";

// Spend one premium-CV credit to unlock premium templates on a CV. Atomic +
// idempotent (an already-unlocked CV costs nothing) via the SECURITY DEFINER
// RPC, which derives the user from auth.uid().
export const POST = handle("unlock-cv-premium", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const { cvId } = (await req.json()) as { cvId: string };
  if (!cvId) return badRequest("cvId required");

  // Comped reviewers unlock for free (no credit spent); everyone else spends one.
  //
  // The write goes through the service-role client because `premium_unlocked` is
  // no longer UPDATE-grantable to `authenticated` (migration 023) — the whole
  // point being that only the server can flip an entitlement flag. The
  // `.eq("user_id", user.id)` filter is what scopes it now that RLS is bypassed,
  // so it must never be dropped.
  if (await isCompAccount(supabase)) {
    const { error: upErr } = await createAdminClient()
      .from("cvs")
      .update({ premium_unlocked: true })
      .eq("id", cvId)
      .eq("user_id", user.id);
    if (upErr) throw upErr;
  } else {
    const { data: unlocked, error } = await supabase.rpc("consume_premium_cv_credit", {
      p_cv: cvId,
    });
    if (error) throw error;
    if (!unlocked) return paymentRequired("No premium CV credits left");
  }

  await logEvent(supabase, user.id, "premium_unlocked", { cvId });
  log.info("cv premium unlocked", { cvId, userId: user.id });
  return ok({ unlocked: true });
});
