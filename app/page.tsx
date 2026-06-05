"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Mic, Sparkles, FileDown, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";

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

  const steps = [
    { icon: Mic, titleKey: "landing.step1.title", descKey: "landing.step1.desc" },
    { icon: Sparkles, titleKey: "landing.step2.title", descKey: "landing.step2.desc" },
    { icon: FileDown, titleKey: "landing.step3.title", descKey: "landing.step3.desc" },
  ];

  const testimonials = [
    { quoteKey: "landing.testimonial.1", nameKey: "landing.testimonial.1.name" },
    { quoteKey: "landing.testimonial.2", nameKey: "landing.testimonial.2.name" },
    { quoteKey: "landing.testimonial.3", nameKey: "landing.testimonial.3.name" },
  ];

  const stats = [
    { value: "10,000+", labelKey: "landing.stats.cvs" },
    { value: "5", labelKey: "landing.stats.minutes" },
    { value: "2", labelKey: "landing.stats.languages" },
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
              <SampleCVs caption={t("landing.samples.caption")} />
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
                    {t("landing.cta.primary")} {lang === "ar" ? "←" : "→"}
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-navy-100">
                  <Link href="#how">{t("landing.cta.secondary")}</Link>
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

      <section className="bg-white py-20">
        <div className="container">
          <h2 className="text-center text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            {t("landing.testimonials.title")}
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((tm, i) => (
              <motion.div
                key={tm.quoteKey}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full border-navy-100/60 bg-navy-900 text-white">
                  <CardContent className="flex h-full flex-col gap-5 p-8">
                    <div className="text-3xl text-teal-400">“</div>
                    <p className="flex-1 text-lg leading-relaxed text-white/90">{t(tm.quoteKey)}</p>
                    <div className="text-sm font-medium text-teal-400">{t(tm.nameKey)}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                {t("landing.cta.primary")} {lang === "ar" ? "←" : "→"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100/60 bg-white">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-navy-400 md:flex-row">
          <span>© 2026 VoiceCV — All rights reserved</span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-teal" />
            {t("landing.trust.powered")}
          </span>
        </div>
      </footer>
    </div>
  );
}
