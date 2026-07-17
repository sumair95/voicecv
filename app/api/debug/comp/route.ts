/**
 * Diagnostic: reports the CURRENT logged-in user's comp status straight from the
 * is_comp_account() RPC, surfacing any error the normal path swallows. Safe — it
 * only ever reveals your own status. Open /api/debug/comp in the browser while
 * signed in as the account you're testing premium with.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";

export const runtime = "nodejs";

export const GET = handle("debug-comp", async ({ req }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized("Not signed in — open this while logged in.");

  const { data, error } = await supabase.rpc("is_comp_account");

  return ok({
    signedInAs: user.email,
    userId: user.id,
    comped: data === true,
    rpcReturned: data,
    rpcError: error
      ? {
          message: error.message,
          code: (error as { code?: string }).code ?? null,
          details: (error as { details?: string }).details ?? null,
          hint: (error as { hint?: string }).hint ?? null,
        }
      : null,
  });
});
