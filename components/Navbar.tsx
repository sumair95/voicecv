"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLanguage } from "@/components/LanguageProvider";

export function Navbar({
  authed,
  onSignOut,
}: {
  authed?: boolean;
  onSignOut?: () => void;
}) {
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white">
            <Mic className="h-5 w-5" />
          </span>
          <span className="text-lg">VoiceCV</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          {authed ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{t("dashboard.myCvs")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/jobs">{t("nav.jobs")}</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">{t("nav.profile")}</Link>
              </Button>
              {onSignOut && (
                <Button onClick={onSignOut} variant="outline" size="sm">
                  {t("auth.signOut")}
                </Button>
              )}
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">{t("auth.signIn")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-teal hover:bg-teal-600">
                <Link href="/signup">{t("auth.signUp")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
