"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGES } from "@/lib/i18n";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-teal/5">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <h1 className="text-center text-3xl font-bold text-navy-900 md:text-4xl">
          {t("onb.title")}
        </h1>
        <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-4 sm:grid-cols-4">
          {LANGUAGES.map((l) => {
            const active = picked === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setPicked(l.code as Language)}
                aria-pressed={active}
                className="text-start"
              >
                <Card
                  className={`cursor-pointer border-2 p-6 transition ${
                    active
                      ? "border-teal bg-teal/5 shadow-md"
                      : "border-navy-100 hover:border-teal/50"
                  }`}
                  dir={l.dir}
                >
                  <div className="text-2xl font-bold text-navy-900">{l.label}</div>
                  <div className="mt-2 text-sm text-navy-400">{l.english}</div>
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
