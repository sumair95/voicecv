/**
 * Admin — comp (complimentary access) control. Server-gated to admin emails
 * (ADMIN_EMAILS); non-admins are bounced to the dashboard. The client panel
 * talks to /api/admin/comp (also admin-gated) for every read/write.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { AdminCompPanel } from "@/components/AdminCompPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/admin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

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
