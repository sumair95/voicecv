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
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { VideoDemo } from "@/components/VideoDemo";
import { useLanguage } from "@/components/LanguageProvider";
import { useCurrency } from "@/lib/pricing";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";
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

// A realistic mini-CV card, sized like the old testimonial cards. Shows a real
// snippet of generated output (header, objective, skills, latest job) and links
// to the full WYSIWYG previews on /samples. Lightweight — no CVPreview render.
function SampleCVCard({ cv }: { cv: CVData }) {
  const topJob = cv.experience[0];
  return (
    <Card className="h-full overflow-hidden border-navy-100/60 transition hover:-translate-y-1 hover:border-teal/50 hover:shadow-lg">
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
        <p className="line-clamp-2 text-sm leading-relaxed text-navy-400">
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
        <div className="space-y-1.5 border-t border-navy-100 pt-3 text-xs text-navy-400">
          {topJob && (
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-3 w-3 shrink-0 text-teal" />
              <span className="truncate">
                <span className="font-semibold text-navy-600">
                  {topJob.role}
                </span>{" "}
                · {topJob.company}
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
              <span className="truncate">
                {cv.languages.map((l) => l.name).join(", ")}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SampleCVs({ caption }: { caption: string }) {
  // Three tiny decorative "CV" cards fanned out — fills the empty space
  // above the hero tagline and hints at the variety of CVs the app can
  // produce. Pure CSS, no real data.
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
            className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-white shadow-md ring-1 ring-navy-100 transition hover:z-10 hover:-translate-y-1 hover:rotate-0 ${c.rotate}`}
            style={{ zIndex: 5 - i }}
            aria-hidden
          >
            <div className={`h-4 w-full ${c.header}`} />
            <div className="space-y-1 p-1.5">
              <div className="h-1 w-2/3 rounded-full bg-navy-100" />
              <div className="h-1 w-3/4 rounded-full bg-navy-100" />
              <div className={`h-1 w-1/2 rounded-full ${c.accent}`} />
              <div className="h-1 w-2/3 rounded-full bg-navy-100" />
              <div className="h-1 w-3/5 rounded-full bg-navy-100" />
              <div className={`h-1 w-2/5 rounded-full ${c.accent}`} />
            </div>
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-navy-400">{caption}</span>
    </div>
  );
}

export default function LandingPage() {
  const { t, lang } = useLanguage();
  const { price } = useCurrency();

  const steps = [
    { icon: Mic, titleKey: "landing.step1.title", descKey: "landing.step1.desc" },
    { icon: Sparkles, titleKey: "landing.step2.title", descKey: "landing.step2.desc" },
    { icon: FileDown, titleKey: "landing.step3.title", descKey: "landing.step3.desc" },
  ];

  const exampleCvs = [SAMPLE_CONSTRUCTION, SAMPLE_HOSPITALITY, SAMPLE_DRIVER];

  const stats = [
    { value: "5", labelKey: "landing.stats.minutes" },
    { value: "4", labelKey: "landing.stats.languages" },
    { value: "0", labelKey: "landing.stats.notyping" },
    { value: "100%", labelKey: "landing.stats.free" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

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
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-navy-900 md:text-7xl">
                {t("landing.tagline")}
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-400 md:text-xl">
                {t("landing.subhead")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
                  <Link href="/signup">
                    {t("landing.cta.primary")}
                    <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-navy-100">
                  <Link href="/samples">{t("landing.cta.secondary")}</Link>
                </Button>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-navy-400">
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
                        style={{
                          height: `${30 + ((i * 7) % 70)}%`,
                          animationDelay: `${i * 80}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="border-y border-navy-100/60 bg-white">
        <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-navy-900 md:text-4xl">{s.value}</div>
              <div className="mt-1 text-sm text-navy-400">{t(s.labelKey)}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="container py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
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
              <Card className="h-full border-navy-100/60 transition hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-5 inline-flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-teal/10 text-sm font-bold text-teal-700">
                      {i + 1}
                    </span>
                    <step.icon className="h-6 w-6 text-teal" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy-900">{t(step.titleKey)}</h3>
                  <p className="mt-2 text-navy-400">{t(step.descKey)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <VideoDemo />

      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            {t("samples.title")}
          </h2>
          <p className="mt-2 text-center text-sm text-navy-400">
            {t("samples.subtitle")}
          </p>
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
            <Button asChild variant="outline" size="lg" className="border-navy-100">
              <Link href="/samples">
                {t("samples.link")}
                <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-8 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                <Crown className="h-3.5 w-3.5" />
                {t("landing.premium.badge")}
              </span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-navy-900">
                {t("landing.premium.title", { price: price(PREMIUM_PRICE_USD_CENTS) })}
              </h2>
              <p className="mt-2 text-navy-400">{t("landing.premium.desc")}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-navy-600">
                {["landing.premium.f1", "landing.premium.f2", "landing.premium.f3"].map((k) => (
                  <li key={k} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                    {t(k)}
                  </li>
                ))}
              </ul>
            </div>
            <div className="shrink-0 text-center">
              <div className="whitespace-nowrap text-4xl font-extrabold text-navy-900">
                {price(PREMIUM_PRICE_USD_CENTS)}
              </div>
              <Button asChild size="lg" className="mt-4 bg-amber-500 text-white hover:bg-amber-600">
                <Link href="/signup">
                  {t("landing.cta.primary")}
                  <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

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

      <footer className="border-t border-navy-100/60 bg-white">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-navy-400 md:flex-row">
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
