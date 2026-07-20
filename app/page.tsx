"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mic,
  Sparkles,
  FileDown,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Trophy,
  Languages,
  Search,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { VideoDemo } from "@/components/VideoDemo";
import { ImpactCounters } from "@/components/ImpactCounters";
import { useLanguage } from "@/components/LanguageProvider";
import {
  SAMPLE_CONSTRUCTION,
  SAMPLE_DRIVER,
  SAMPLE_HOSPITALITY,
} from "@/lib/cv/samples";
import type { CVData } from "@/types/cv";

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "CV"
  );
}

// A realistic mini-CV card showing a real snippet of generated output; links to
// the full WYSIWYG previews on /samples.
function SampleCVCard({ cv }: { cv: CVData }) {
  const topJob = cv.experience[0];
  return (
    <Card className="h-full overflow-hidden border-border/60 transition hover:-translate-y-1 hover:border-teal/50 hover:shadow-lg">
      <div className="flex items-center gap-3 bg-navy-900 p-5 text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-teal text-sm font-bold">
          {initialsOf(cv.personal.full_name)}
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold">{cv.personal.full_name}</div>
          <div className="truncate text-xs text-teal-400">
            {topJob?.role} · {cv.personal.city}
          </div>
        </div>
      </div>
      <CardContent className="space-y-3 p-5">
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {cv.objective}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {cv.skills.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal-700"
            >
              {s}
            </span>
          ))}
        </div>
        <div className="space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          {topJob && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0 text-teal" />
              <span className="truncate">
                <span className="font-semibold text-foreground">{topJob.role}</span> · {topJob.company}
              </span>
            </div>
          )}
          {cv.education[0] && (
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 shrink-0 text-teal" />
              <span className="truncate">{cv.education[0].degree}</span>
            </div>
          )}
          {cv.achievements[0] && (
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3 w-3 shrink-0 text-teal" />
              <span className="truncate">{cv.achievements[0]}</span>
            </div>
          )}
          {cv.languages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Languages className="h-3 w-3 shrink-0 text-teal" />
              <span className="truncate">{cv.languages.map((l) => l.name).join(", ")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SampleCVs({ caption }: { caption: string }) {
  const cards = [
    { rotate: "-rotate-[8deg]", header: "bg-navy-900", accent: "bg-teal" },
    { rotate: "rotate-[1deg]", header: "bg-teal", accent: "bg-navy-900" },
    { rotate: "rotate-[10deg]", header: "bg-navy-900", accent: "bg-teal-400" },
  ];
  return (
    <div className="mb-2 flex items-center gap-4">
      <div className="flex -space-x-3">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-card shadow-md ring-1 ring-border transition hover:z-10 hover:-translate-y-1 hover:rotate-0 ${c.rotate}`}
            style={{ zIndex: 5 - i }}
            aria-hidden
          >
            <div className={`h-4 w-full ${c.header}`} />
            <div className="space-y-1 p-1.5">
              <div className="h-1 w-2/3 rounded-full bg-muted" />
              <div className="h-1 w-3/4 rounded-full bg-muted" />
              <div className={`h-1 w-1/2 rounded-full ${c.accent}`} />
              <div className="h-1 w-2/3 rounded-full bg-muted" />
              <div className="h-1 w-3/5 rounded-full bg-muted" />
              <div className={`h-1 w-2/5 rounded-full ${c.accent}`} />
            </div>
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-muted-foreground">{caption}</span>
    </div>
  );
}

export default function LandingPage() {
  const { t, lang } = useLanguage();

  const features = [
    { icon: Mic, titleKey: "landing.feature1.title", descKey: "landing.feature1.desc" },
    { icon: Search, titleKey: "landing.feature2.title", descKey: "landing.feature2.desc" },
    { icon: Target, titleKey: "landing.feature3.title", descKey: "landing.feature3.desc" },
  ];

  const steps = [
    { icon: Mic, titleKey: "landing.step1.title", descKey: "landing.step1.desc" },
    { icon: Sparkles, titleKey: "landing.step2.title", descKey: "landing.step2.desc" },
    { icon: FileDown, titleKey: "landing.step3.title", descKey: "landing.step3.desc" },
  ];

  const exampleCvs = [SAMPLE_CONSTRUCTION, SAMPLE_HOSPITALITY, SAMPLE_DRIVER];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="gradient-mesh absolute inset-0 -z-10 opacity-70" />
        <div
          className="absolute -top-32 start-1/2 -z-10 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-teal/10 blur-3xl animate-mesh"
          aria-hidden
        />
        <div className="container py-20 md:py-28">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Link href="/samples" className="inline-block transition hover:opacity-90">
                <SampleCVs caption={t("samples.link")} />
              </Link>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/5 px-3 py-1 text-xs font-medium text-teal-700">
                <Sparkles className="h-3.5 w-3.5" />
                {t("landing.trust.powered")}
              </div>
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-7xl">
                {t("landing.tagline")}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                {t("landing.subhead")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
                  <Link href="/signup">
                    {t("landing.cta.primary")}
                    <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border">
                  <Link href="/samples">{t("landing.cta.secondary")}</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal" />
                  {t("landing.trust.vision")}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {t("landing.trust.nocode")}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative mx-auto w-full max-w-sm"
            >
              <div className="relative aspect-[9/19] rounded-[2.5rem] border-[10px] border-navy-900 bg-navy-900 shadow-2xl">
                <div className="absolute start-1/2 top-2 h-1.5 w-20 -translate-x-1/2 rounded-full bg-navy-600" />
                <div className="flex h-full flex-col items-center justify-center gap-6 rounded-[2rem] bg-gradient-to-b from-navy-900 to-navy-600 p-8 text-center">
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-teal/40 animate-pulse-ring" />
                    <span className="relative grid h-24 w-24 place-items-center rounded-full bg-teal text-white shadow-lg shadow-teal/40">
                      <Mic className="h-10 w-10" />
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/90">
                    {t("rec.questionOf", { n: 2, total: 5 })}
                  </p>
                  <p className="text-base font-semibold leading-relaxed text-white">
                    {lang === "ar"
                      ? "ما هي الوظائف التي عملت بها سابقاً؟"
                      : "What jobs have you done?"}
                  </p>
                  <div className="flex h-12 items-end gap-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-teal-400 animate-wave"
                        style={{ height: `${30 + ((i * 7) % 70)}%`, animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Real, authentic impact counters */}
      <ImpactCounters />

      {/* The three pillars — CV, Job Match, Tailoring */}
      <section id="features" className="container py-20 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">{t("landing.features.subtitle")}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.titleKey}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-lg"
            >
              <span
                className="absolute -end-8 -top-8 h-28 w-28 rounded-full bg-teal/5 blur-2xl transition group-hover:bg-teal/15"
                aria-hidden
              />
              <div className="relative flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-navy-900 text-teal shadow-sm">
                  <f.icon className="h-7 w-7" />
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
                  {`0${i + 1}`}
                </span>
              </div>
              <h3 className="relative mt-5 text-xl font-bold text-foreground">{t(f.titleKey)}</h3>
              <p className="relative mt-2 leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-card py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t("landing.steps.title")}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.titleKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
              >
                <Card className="h-full border-border/60 transition hover:-translate-y-1 hover:shadow-lg">
                  <CardContent className="p-8">
                    <div className="mb-5 inline-flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-teal/10 text-sm font-bold text-teal-700">
                        {i + 1}
                      </span>
                      <step.icon className="h-6 w-6 text-teal" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{t(step.titleKey)}</h3>
                    <p className="mt-2 text-muted-foreground">{t(step.descKey)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <VideoDemo />

      {/* Sample output */}
      <section className="container py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {t("samples.title")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{t("samples.subtitle")}</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {exampleCvs.map((cv, i) => (
            <motion.div
              key={cv.personal.full_name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href="/samples" className="block h-full">
                <SampleCVCard cv={cv} />
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Button asChild variant="outline" size="lg" className="border-border">
            <Link href="/samples">
              {t("samples.link")}
              <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-8 py-16 text-center text-white">
          <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full bg-teal/20 blur-3xl" />
          <h2 className="relative text-3xl font-bold md:text-4xl">{t("landing.tagline")}</h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-white/70">{t("landing.subhead")}</p>
          <div className="relative mt-8">
            <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
              <Link href="/signup">
                {t("landing.cta.primary")}
                <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-card">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground md:flex-row">
          <span>{t("landing.footer.copyright")}</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal" />
            {t("landing.trust.powered")}
          </span>
        </div>
      </footer>
    </div>
  );
}
