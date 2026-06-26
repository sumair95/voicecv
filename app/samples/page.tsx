"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { CVPreview } from "@/components/CVPreview";
import { useLanguage } from "@/components/LanguageProvider";
import { TEMPLATES } from "@/types/cv";
import {
  SAMPLE_CONSTRUCTION,
  SAMPLE_DRIVER,
  SAMPLE_HOSPITALITY,
} from "@/lib/cv/samples";
import type { CVData, TemplateId } from "@/types/cv";

// CVs always render in English (the product's output language), so the
// gallery previews are pinned to English regardless of the UI language.
const GALLERY: { cv: CVData; template: TemplateId; style: string }[] = [
  { cv: SAMPLE_CONSTRUCTION, template: "modern", style: "Modern" },
  { cv: SAMPLE_HOSPITALITY, template: "minimalist", style: "Minimalist" },
  { cv: SAMPLE_DRIVER, template: "modern", style: "Modern" },
];

export default function SamplesPage() {
  const { t } = useLanguage();
  const premium = TEMPLATES.filter((tpl) => tpl.premium);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container py-12 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-navy-900 md:text-4xl">
            {t("samples.title")}
          </h1>
          <p className="mt-3 text-navy-400">{t("samples.subtitle")}</p>
        </div>

        <div className="mt-12 space-y-14">
          {GALLERY.map((item, i) => (
            <motion.div
              key={item.cv.personal.full_name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="mx-auto max-w-3xl"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-navy-900">
                    {item.cv.personal.full_name}
                  </h2>
                  <p className="text-sm text-navy-400">
                    {item.cv.experience[0]?.role} · {item.style}
                  </p>
                </div>
                <Badge className="bg-teal/10 text-teal-700 hover:bg-teal/10">
                  {t("samples.free")}
                </Badge>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-navy-100/60 bg-white p-3 shadow-sm md:p-6">
                <CVPreview cvData={item.cv} language="en" template={item.template} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Premium styles — honestly shown as not-yet-available rather than faked. */}
        {premium.length > 0 && (
          <div className="mx-auto mt-16 max-w-3xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {premium.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-col gap-2 rounded-2xl border border-dashed border-navy-100 bg-navy-50/40 p-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-navy-700">{tpl.name}</h3>
                    <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700">
                      <Crown className="h-3 w-3" />
                      {t("samples.premium")}
                    </Badge>
                  </div>
                  <p className="text-sm text-navy-400">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <Button asChild size="lg" className="bg-teal hover:bg-teal-600">
            <Link href="/signup">
              {t("samples.cta")}
              <ArrowRight className="ms-2 h-5 w-5 rtl:-scale-x-100" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
