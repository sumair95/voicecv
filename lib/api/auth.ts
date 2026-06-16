/**
 * Unified auth context for API routes.
 *
 * The web client authenticates with Supabase cookies (set by `@supabase/ssr`).
 * The mobile client (Expo) authenticates by sending an `Authorization: Bearer
 * <access_token>` header. The same routes need to serve both.
 *
 * `getAuthContext(req)` returns:
 *   - `user`: the resolved User or null
 *   - `supabase`: a server client whose RLS is bound to that user — use it
 *     for every subsequent query in the route so policies fire correctly.
 *
 * For Bearer-token requests we build a fresh non-SSR client with the token
 * pinned via the Authorization header. For cookie requests we reuse the
 * existing SSR client.
 */

import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

export interface AuthContext {
  user: User | null;
  supabase: SupabaseClient;
}

export async function getAuthContext(req: Request): Promise<AuthContext> {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    const supabase = createPlainClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );
    const { data, error } = await supabase.auth.getUser(token);
    return { user: error ? null : data.user, supabase };
  }

  // Cookie path — web client.
  const supabase = createServerClient();
  const { data } = await supabase.auth.getUser();
  return { user: data.user ?? null, supabase };
}
