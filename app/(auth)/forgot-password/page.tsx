"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/reset-password`
        : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
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
              {t("auth.forgot.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {sent ? t("auth.forgot.sent") : t("auth.forgot.desc")}
            </p>

            {!sent ? (
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
                <Button
                  type="submit"
                  className="w-full bg-teal hover:bg-teal-600"
                  disabled={loading}
                >
                  {loading ? t("common.loading") : t("auth.forgot.send")}
                </Button>
              </form>
            ) : (
              <div className="mt-6 rounded-lg border border-teal/30 bg-teal/5 px-4 py-3 text-sm text-teal-700">
                {t("auth.forgot.checkInbox")}
              </div>
            )}

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
