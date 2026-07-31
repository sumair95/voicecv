/**
 * Diagnostic: reports the CURRENT logged-in user's comp status straight from the
 * is_comp_account() RPC, surfacing any error the normal path swallows. Safe — it
 * only ever reveals your own status. Open /api/debug/comp in the browser while
 * signed in as the account you're testing premium with.
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";
import { isAdminEmail } from "@/lib/admin";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle("debug-comp", async ({ req }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized("Not signed in — open this while logged in.");
  // Diagnostic endpoint: admin-only (L2). It only ever reports the caller's own
  // status, but there's no reason to expose raw RPC errors to normal users.
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
