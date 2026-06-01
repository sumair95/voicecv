"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import type { Language } from "@/types/cv";

export default function OnboardingPage() {
  const { setLang, t } = useLanguage();
  const router = useRouter();
  const [picked, setPicked] = useState<Language>("en");
  const [loading, setLoading] = useState(false);

  async function continueOn() {
    setLoading(true);
    setLang(picked);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ language: picked }).eq("id", user.id);
    }
    setLoading(false);
    router.push("/dashboard");
    router.refresh();
    toast.success("All set!");
  }

  const choices: { code: Language; label: string; sub: string }[] = [
    { code: "en", label: "English", sub: "Continue in English" },
    { code: "ar", label: "العربية", sub: "المتابعة بالعربية" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-teal/5">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <h1 className="text-center text-3xl font-bold text-navy-900 md:text-4xl">
          {t("onb.title")}
        </h1>
        <div className="mt-10 grid w-full max-w-3xl gap-4 md:grid-cols-2">
          {choices.map((c) => {
            const active = picked === c.code;
            return (
              <button
                key={c.code}
                onClick={() => setPicked(c.code)}
                className={`text-${c.code === "ar" ? "right" : "left"}`}
                aria-pressed={active}
              >
                <Card
                  className={`cursor-pointer border-2 p-8 transition ${
                    active
                      ? "border-teal bg-teal/5 shadow-md"
                      : "border-navy-100 hover:border-teal/50"
                  }`}
                  dir={c.code === "ar" ? "rtl" : "ltr"}
                >
                  <div className="text-3xl font-bold text-navy-900">{c.label}</div>
                  <div className="mt-2 text-sm text-navy-400">{c.sub}</div>
                </Card>
              </button>
            );
          })}
        </div>
        <Button
          size="lg"
          className="mt-10 bg-teal hover:bg-teal-600"
          onClick={continueOn}
          disabled={loading}
        >
          {loading ? t("common.loading") : t("onb.continue")}
        </Button>
      </div>
    </div>
  );
}
