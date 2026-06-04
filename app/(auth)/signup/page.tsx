"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    if (data.session) {
      toast.success("Welcome to VoiceCV!");
      router.push("/onboarding");
      router.refresh();
    } else {
      toast.success("Check your email to confirm your account.");
    }
  }

  async function signUpWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding` },
    });
    if (error) {
      console.error("[google-signup]", error);
      toast.error(
        error.message.toLowerCase().includes("provider")
          ? "Google sign-in is not enabled yet. Enable Google in Supabase → Auth → Providers."
          : error.message,
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-teal/5">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-navy-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
            <Mic className="h-5 w-5" />
          </span>
          VoiceCV
        </Link>
        <LanguageToggle />
      </div>

      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md border-navy-100/60 shadow-lg">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-navy-900">{t("auth.signup.title")}</h1>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">{t("auth.fullName")}</Label>
                <Input
                  id="full_name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                />
              </div>
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
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-teal hover:bg-teal-600"
                disabled={loading}
              >
                {loading ? t("common.loading") : t("auth.signUp")}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-navy-100" />
              <span className="text-xs text-navy-400">or</span>
              <span className="h-px flex-1 bg-navy-100" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={signUpWithGoogle}
            >
              Continue with Google
            </Button>

            <p className="mt-6 text-center text-sm text-navy-400">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="font-medium text-teal-700 hover:underline">
                {t("auth.signIn")}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
