"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  // The reset link carries a recovery token Supabase parses client-side
  // and emits as PASSWORD_RECOVERY. Once we see it, the user is ready
  // to set a new password.
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also flip ready if there's already an active session — handles
    // the case where the page was opened with a previously-claimed token.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated. Sign in with your new password.");
    await supabase.auth.signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-teal/5">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
            <Mic className="h-5 w-5" />
          </span>
          VoiceCV
        </Link>
        <LanguageToggle />
      </div>

      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md border-border/60 shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground">
              {t("auth.reset.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {ready ? t("auth.reset.desc") : t("auth.reset.waiting")}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.reset.newPassword")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={!ready}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">{t("auth.reset.confirm")}</Label>
                <Input
                  id="confirm"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  disabled={!ready}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-teal hover:bg-teal-600"
                disabled={loading || !ready}
              >
                {loading ? t("common.loading") : t("auth.reset.update")}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-teal-700 hover:underline">
                {t("auth.forgot.backToLogin")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
