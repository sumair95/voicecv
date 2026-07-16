/**
 * Admin gate. An email is an admin iff it appears (case-insensitively) in the
 * `ADMIN_EMAILS` env var (comma-separated). Absent/empty → nobody is admin, so
 * the /admin page + API are locked down by default (fail closed).
 *
 * Server-only: reads a non-public env var, so it must never run in the browser.
 */

import { serverEnv } from "@/lib/env";

export function adminEmails(): string[] {
  return (serverEnv.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
