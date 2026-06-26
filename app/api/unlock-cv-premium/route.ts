import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, paymentRequired, unauthorized } from "@/lib/api/respond";

export const runtime = "nodejs";

// Spend one premium-CV credit to unlock premium templates on a CV. Atomic +
// idempotent (an already-unlocked CV costs nothing) via the SECURITY DEFINER
// RPC, which derives the user from auth.uid().
export const POST = handle("unlock-cv-premium", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const { cvId } = (await req.json()) as { cvId: string };
  if (!cvId) return badRequest("cvId required");

  const { data: unlocked, error } = await supabase.rpc("consume_premium_cv_credit", {
    p_cv: cvId,
  });
  if (error) throw error;
  if (!unlocked) return paymentRequired("No premium CV credits left");

  log.info("cv premium unlocked", { cvId, userId: user.id });
  return ok({ unlocked: true });
});
