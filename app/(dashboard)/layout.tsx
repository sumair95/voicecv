"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Sign the user out after 3 minutes of no mouse / keyboard / touch activity.
  useInactivityLogout();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar authed onSignOut={signOut} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
