"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Plus, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import { createClient } from "@/lib/supabase/client";
import type { CVRecord, Profile } from "@/types/cv";

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [cvs, setCvs] = useState<CVRecord[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileRow }, { data: cvRows }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("cvs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      setProfile(profileRow as Profile | null);
      setCvs((cvRows as CVRecord[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const greetingName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-navy-900">
            {t("dashboard.welcome")}{greetingName ? `, ${greetingName}` : ""} 👋
          </h1>
          <p className="mt-1 text-navy-400">{t("dashboard.myCvs")}</p>
        </div>
        <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
          <Link href="/record">
            <Plus className="me-2 h-5 w-5" />
            {t("dashboard.create")}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-navy-100/60">
              <CardContent className="h-40 animate-pulse bg-navy-50/40" />
            </Card>
          ))}
        </div>
      ) : cvs.length === 0 ? (
        <Card className="border-dashed border-navy-100">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-teal/10 text-teal">
              <Sparkles className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-navy-900">{t("dashboard.empty.title")}</h2>
            <p className="max-w-md text-navy-400">{t("dashboard.empty.desc")}</p>
            <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
              <Link href="/record">
                <Plus className="me-2 h-5 w-5" />
                {t("dashboard.create")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv, i) => (
            <motion.div
              key={cv.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link href={`/cv/${cv.id}`}>
                <Card className="h-full border-navy-100/60 transition hover:-translate-y-0.5 hover:border-teal/50 hover:shadow-md">
                  <CardContent className="space-y-3 p-6">
                    <div className="flex items-center justify-between gap-2">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal/10 text-teal">
                        <FileText className="h-5 w-5" />
                      </span>
                      <Badge variant={cv.status === "ready" || cv.status === "exported" ? "default" : "secondary"}>
                        {t(`status.${cv.status}`)}
                      </Badge>
                    </div>
                    <div>
                      <div className="line-clamp-1 font-semibold text-navy-900">
                        {cv.title ?? cv.cv_data?.personal?.full_name ?? "Untitled CV"}
                      </div>
                      <div className="mt-1 text-sm text-navy-400">
                        {format(new Date(cv.created_at), lang === "ar" ? "yyyy/MM/dd" : "MMM d, yyyy")}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
