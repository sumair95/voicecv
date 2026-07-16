"use client";

/**
 * Admin — comp (complimentary access) control. Access is enforced server-side by
 * /api/admin/comp (ADMIN_EMAILS gated); this page just renders the panel, which
 * shows an "access denied" state if the API rejects the caller. Client component
 * on purpose: auth is read via the browser Supabase session (the server-side
 * getUser() pattern can't refresh tokens in an App Router server component and
 * would spuriously bounce a signed-in admin to /login).
 */

import { AdminCompPanel } from "@/components/AdminCompPanel";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-navy-900">Admin · Comp access</h1>
        <p className="mt-1 text-navy-400">
          Give reviewers free access to Premium CV, Cover Letter download, and the job-match CV
          rewrite — no card, no credit spent. Real users are never affected.
        </p>
      </div>
      <AdminCompPanel />
    </div>
  );
}
