"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  // Set by the signup page when the account needs email confirmation.
  const awaitingConfirm = params.get("confirm") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
    });
    if (error) {
      console.error("[google-signin]", error);
      toast.error(
        error.message.toLowerCase().includes("provider")
          ? "Google sign-in is not enabled yet. Enable Google in Supabase → Auth → Providers."
          : error.message,
      );
    }
  }

  return (
    <Card className="w-full max-w-md border-border/60 shadow-lg">
      <CardContent className="p-8">
        <h1 className="text-2xl font-bold text-foreground">{t("auth.login.title")}</h1>

        {awaitingConfirm && (
          <p
            role="status"
            // teal-800/200 are NOT defined in tailwind.config (palette is
            // 50/100/400/500/600/700) — an undefined shade applies no colour at
            // all and silently inherits the page foreground. Stick to real ones.
            className="mt-4 rounded-lg border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal-700 dark:text-teal-100"
          >
            {t("auth.login.confirmNotice")}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-teal hover:bg-teal-600"
            disabled={loading}
          >
            {loading ? t("common.loading") : t("auth.signIn")}
          </Button>

          <div className="mt-3 text-center">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              {t("auth.forgot.link")}
            </Link>
          </div>
        </form>

        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-muted" />
          <span className="text-xs text-muted-foreground">or</span>
          <span className="h-px flex-1 bg-muted" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={signInWithGoogle}
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="font-medium text-teal-700 hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background to-teal/5">
      <div className="gradient-mesh pointer-events-none absolute inset-0 -z-10 opacity-40" aria-hidden />
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
        <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
