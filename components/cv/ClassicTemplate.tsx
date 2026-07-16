"use client";

import type { CVData } from "@/types/cv";
import { Editable, CvPhoto } from "@/components/cv/primitives";
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

// Module-level so the component identity is stable across renders (defining it
// inside the template would remount inputs and drop focus while editing).
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="text-center text-sm font-bold uppercase tracking-[0.3em] text-navy-900">
        {title}
      </h2>
      <div className="mx-auto mt-1.5 h-px w-16 bg-navy-300" />
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Classic — traditional, centered, serif. */
export function ClassicTemplate({ data, editable, patch, t, isRtl }: Props) {
  const ctx = { data, editable, patch, t };
  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className="mx-auto w-full max-w-[210mm] bg-white p-12 font-serif text-navy-700 shadow-sm print:shadow-none"
      style={{ minHeight: "297mm" }}
    >
      <header className="text-center">
        {data.personal.photo_url && (
          <div className="mb-4 flex justify-center">
            <CvPhoto
              url={data.personal.photo_url}
              className="h-28 w-28 rounded-full object-cover ring-1 ring-navy-200"
            />
          </div>
        )}
        <h1 className="text-4xl font-semibold tracking-wide text-navy-900">
          <Editable
            value={data.personal.full_name}
            editable={editable}
            onChange={(v) => patch({ personal: { ...data.personal, full_name: v } })}
            placeholder={t("auth.fullName")}
          />
        </h1>
        {(editable || data.personal.job_title) && (
          <p className="mt-1 text-lg font-medium text-navy-500">
            <Editable
              value={data.personal.job_title}
              editable={editable}
              onChange={(v) => patch({ personal: { ...data.personal, job_title: v } })}
              placeholder={t("cv.jobTitle")}
            />
          </p>
        )}
        <div className="mx-auto mt-3 h-px w-24 bg-navy-300" />
        <p className="mt-3 text-sm text-navy-400">
          <ContactInline {...ctx} />
        </p>
        {showSection(data.socials.length, editable) && (
          <p className="mt-2 text-sm text-navy-400">
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
