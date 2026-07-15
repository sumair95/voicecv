/**
 * Validated environment variables.
 *
 * Reads `process.env` once at module load. Any missing required variable
 * throws immediately with a clear message — much better than a cryptic
 * "undefined.replace is not a function" deep inside Supabase or Claude.
 *
 * Server-only secrets are not validated in the browser (NEXT_PUBLIC_* only).
 */

import { z } from "zod";

const sharedSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

const serverSchema = sharedSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  // Optional: enables AI Job Match (JSearch on RapidAPI). Feature degrades to a
  // clear "not configured" message when absent, so it's not required to boot.
  RAPIDAPI_KEY: z.string().min(1).optional(),
  // Optional: Adzuna is the backup job provider (covers Australia + rescues
  // JSearch timeouts). Both are needed together; absent = provider is skipped.
  ADZUNA_APP_ID: z.string().min(1).optional(),
  ADZUNA_APP_KEY: z.string().min(1).optional(),
  // Optional: remove.bg key for the paid "professional photo" conversion. Absent
  // = the feature returns "not available yet".
  REMOVEBG_API_KEY: z.string().min(1).optional(),
});

function readShared() {
  const parsed = sharedSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
  if (!parsed.success) {
    throw new Error(
      "Invalid public environment: " +
        parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "),
    );
  }
  return parsed.data;
}

function readServer() {
  const parsed = serverSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
    ADZUNA_APP_ID: process.env.ADZUNA_APP_ID,
    ADZUNA_APP_KEY: process.env.ADZUNA_APP_KEY,
    REMOVEBG_API_KEY: process.env.REMOVEBG_API_KEY,
  });
  if (!parsed.success) {
    throw new Error(
      "Invalid server environment: " +
        parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; "),
    );
  }
  return parsed.data;
}

/** Public env — safe in browser bundles. */
export const publicEnv = readShared();

/**
 * Server env — only call from route handlers, server components, or
 * server-only lib modules. Throws at first access in the browser.
 */
export const serverEnv = (() => {
  if (typeof window !== "undefined") {
    return new Proxy({} as ReturnType<typeof readServer>, {
      get(_, key) {
        throw new Error(
          `serverEnv.${String(key)} accessed in the browser; use publicEnv instead`,
        );
      },
    });
  }
  return readServer();
})();
