"use client";

import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      aria-label="Toggle language"
    >
      <Globe className="h-4 w-4 me-2" />
      {lang === "en" ? "العربية" : "English"}
    </Button>
  );
}
