/**
 * Admin API for the comp (complimentary access) allowlist. Admin-email gated.
 *
 * GET  → { comp_enabled, emails: [{ email, note, created_at }] }
 * POST → { action: "toggle", enabled } | { action: "add", email, note? }
 *                                       | { action: "remove", email }
 *
 * Reads/writes the locked comp tables with the service-role admin client (they
 * have no RLS policies, so only this path can touch them).
 */

import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { badRequest, ok, unauthorized } from "@/lib/api/respond";
import { NextResponse } from "next/server";
import { isAdminEmail } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function requireAdmin(req: Request) {
  const { user } = await getAuthContext(req);
  if (!user) return { error: unauthorized() as NextResponse };
  if (!isAdminEmail(user.email)) return { error: forbidden() };
  return { user };
}

export const GET = handle("admin-comp-get", async ({ req }) => {
  const gate = await requireAdmin(req);
  if (gate.error) return gate.error;

  const admin = createAdminClient();
  const [{ data: settings }, { data: emails }] = await Promise.all([
    admin.from("app_settings").select("comp_enabled, free_mode").eq("id", 1).single(),
    admin.from("comp_accounts").select("email, note, created_at").order("created_at", { ascending: false }),
  ]);
  return ok({
    comp_enabled: settings?.comp_enabled ?? false,
    free_mode: settings?.free_mode ?? false,
    emails: emails ?? [],
  });
});

interface PostBody {
  action?: "toggle" | "freemode" | "add" | "remove";
  enabled?: boolean;
  email?: string;
  note?: string;
}

export const POST = handle("admin-comp-post", async ({ req, log }) => {
  const gate = await requireAdmin(req);
  if (gate.error) return gate.error;

  const body = (await req.json()) as PostBody;
  const admin = createAdminClient();

  if (body.action === "toggle") {
    const enabled = body.enabled === true;
    const { error } = await admin
      .from("app_settings")
      .update({ comp_enabled: enabled, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    log.info("comp toggle", { enabled, by: gate.user.email });
    return ok({ comp_enabled: enabled });
  }

  if (body.action === "freemode") {
    const enabled = body.enabled === true;
    const { error } = await admin
      .from("app_settings")
      .update({ free_mode: enabled, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) throw error;
    log.info("free mode toggle", { enabled, by: gate.user.email });
    return ok({ free_mode: enabled });
  }

  if (body.action === "add") {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email || !email.includes("@")) return badRequest("A valid email is required");
    const { error } = await admin
      .from("comp_accounts")
      .upsert({ email, note: body.note?.trim() || null }, { onConflict: "email" });
    if (error) throw error;
    log.info("comp add", { email, by: gate.user.email });
    return ok({ added: email });
  }

  if (body.action === "remove") {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!email) return badRequest("email required");
    const { error } = await admin.from("comp_accounts").delete().eq("email", email);
    if (error) throw error;
    log.info("comp remove", { email, by: gate.user.email });
    return ok({ removed: email });
  }

  return badRequest("Unknown action");
});
