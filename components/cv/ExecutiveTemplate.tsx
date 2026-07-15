"use client";

import type { CVData } from "@/types/cv";
import { Editable } from "@/components/cv/primitives";
import {
  ObjectiveContent,
  ExperienceContent,
  EducationContent,
  CertificatesContent,
  SkillsContent,
  LanguagesContent,
  HobbiesContent,
  AchievementsContent,
  ContactInline,
  SocialsInline,
  showSection,
} from "@/components/cv/sections";

interface Props {
  data: CVData;
  editable?: boolean;
  patch: (next: Partial<CVData>) => void;
  t: (key: string) => string;
  isRtl: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-navy-900">
        <span className="h-4 w-1 rounded-full bg-teal" />
        {title}
      </h2>
      <div className="mt-3 ps-3">{children}</div>
    </section>
  );
}

/** Executive — bold navy header band with teal-accented section headings. */
export function ExecutiveTemplate({ data, editable, patch, t, isRtl }: Props) {
  const ctx = { data, editable, patch, t };
  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-[210mm] overflow-hidden bg-white p-12 text-navy-700 shadow-sm print:shadow-none"
      style={{ minHeight: "297mm" }}
    >
      <header className="-mx-12 -mt-12 mb-2 border-b-4 border-teal bg-navy-900 px-12 py-10 text-white">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">
          <Editable
            value={data.personal.full_name}
            editable={editable}
            onChange={(v) => patch({ personal: { ...data.personal, full_name: v } })}
            placeholder={t("auth.fullName")}
          />
        </h1>
        {(editable || data.personal.job_title) && (
          <p className="mt-1 text-lg font-medium text-teal-200">
            <Editable
              value={data.personal.job_title}
              editable={editable}
              onChange={(v) => patch({ personal: { ...data.personal, job_title: v } })}
              placeholder={t("cv.jobTitle")}
            />
          </p>
        )}
        <p className="mt-3 text-sm text-white/70">
          <ContactInline {...ctx} />
        </p>
        {showSection(data.socials.length, editable) && (
          <p className="mt-2 text-sm text-white/70">
            <SocialsInline {...ctx} />
          </p>
        )}
      </header>

      {showSection(data.objective ? 1 : 0, editable) && (
        <Section title={t("cv.objective")}>
          <ObjectiveContent {...ctx} />
        </Section>
      )}
      {showSection(data.experience.length, editable) && (
        <Section title={t("cv.experience")}>
          <ExperienceContent {...ctx} />
        </Section>
      )}
      {showSection(data.education.length, editable) && (
        <Section title={t("cv.education")}>
          <EducationContent {...ctx} />
        </Section>
      )}
      {showSection(data.certificates.length, editable) && (
        <Section title={t("cv.certificates")}>
          <CertificatesContent {...ctx} />
        </Section>
      )}
      {showSection(data.skills.length, editable) && (
        <Section title={t("cv.skills")}>
          <SkillsContent {...ctx} />
        </Section>
      )}
      {showSection(data.languages.length, editable) && (
        <Section title={t("cv.languages")}>
          <LanguagesContent {...ctx} />
        </Section>
      )}
      {showSection(data.hobbies.length, editable) && (
        <Section title={t("cv.hobbies")}>
          <HobbiesContent {...ctx} />
        </Section>
      )}
      {showSection(data.achievements.length, editable) && (
        <Section title={t("cv.achievement")}>
          <AchievementsContent {...ctx} />
        </Section>
      )}
    </article>
  );
}
