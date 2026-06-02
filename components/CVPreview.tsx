"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Flag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/LanguageProvider";
import type { CVData, Language } from "@/types/cv";

interface Props {
  cvData: CVData;
  language: Language;
  editable?: boolean;
  onChange?: (updated: CVData) => void;
}

function initialsOf(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

function Editable({
  value,
  onChange,
  editable,
  className,
  multiline,
  placeholder,
}: {
  value: string;
  onChange?: (next: string) => void;
  editable?: boolean;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  if (!editable) {
    return <span className={className}>{value || placeholder}</span>;
  }
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-placeholder={placeholder}
      className={`rounded outline-none transition focus:bg-teal/10 focus:ring-2 focus:ring-teal/30 ${className ?? ""}`}
      onBlur={(e) =>
        onChange?.(
          multiline
            ? e.currentTarget.innerText
            : e.currentTarget.innerText.replace(/\s+/g, " ").trim(),
        )
      }
    />
  );
}

export function CVPreview({ cvData, language, editable, onChange }: Props) {
  const { t } = useLanguage();
  const [data, setData] = useState<CVData>(cvData);

  useEffect(() => {
    setData(cvData);
  }, [cvData]);

  function patch(next: Partial<CVData>) {
    const merged = { ...data, ...next };
    setData(merged);
    onChange?.(merged);
  }

  const isRtl = language === "ar" || language === "ur";

  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className="mx-auto grid w-full max-w-[210mm] grid-cols-12 overflow-hidden rounded-xl border border-navy-100/60 bg-white shadow-sm print:shadow-none"
      style={{ minHeight: "297mm" }}
    >
      {/* Sidebar */}
      <aside className="col-span-12 bg-navy-900 p-8 text-white md:col-span-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-teal text-2xl font-bold text-white">
            {initialsOf(data.personal.full_name)}
          </div>
          <h1 className="text-2xl font-bold leading-tight">
            <Editable
              value={data.personal.full_name}
              editable={editable}
              onChange={(v) =>
                patch({ personal: { ...data.personal, full_name: v } })
              }
              placeholder={t("auth.fullName")}
            />
          </h1>
          {(data.personal.city || editable) && (
            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5" />
              <Editable
                value={data.personal.city}
                editable={editable}
                onChange={(v) =>
                  patch({ personal: { ...data.personal, city: v } })
                }
                placeholder="City"
              />
            </div>
          )}
          {(data.personal.nationality || editable) && (
            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <Flag className="h-3.5 w-3.5" />
              <Editable
                value={data.personal.nationality}
                editable={editable}
                onChange={(v) =>
                  patch({ personal: { ...data.personal, nationality: v } })
                }
                placeholder={t("cv.nationality")}
              />
            </div>
          )}
        </div>

        <div className="my-6 h-px bg-white/10" />

        <Section title={t("cv.contact")} dark>
          {(data.personal.email || editable) && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 text-teal-400" />
              <Editable
                value={data.personal.email}
                editable={editable}
                onChange={(v) =>
                  patch({ personal: { ...data.personal, email: v } })
                }
                placeholder="email@example.com"
                className="text-white/90"
              />
            </div>
          )}
          {(data.personal.phone || editable) && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 text-teal-400" />
              <Editable
                value={data.personal.phone}
                editable={editable}
                onChange={(v) =>
                  patch({ personal: { ...data.personal, phone: v } })
                }
                placeholder="+966"
                className="text-white/90"
              />
            </div>
          )}
        </Section>

        {(data.skills.length > 0 || editable) && (
          <Section title={t("cv.skills")} dark>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => (
                <Badge
                  key={`${skill}-${i}`}
                  className="border-none bg-teal/20 font-normal text-teal-100 hover:bg-teal/30"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        {(data.languages.length > 0 || editable) && (
          <Section title={t("cv.languages")} dark>
            <ul className="space-y-1.5 text-sm text-white/90">
              {data.languages.map((lng, i) => (
                <li
                  key={`${lng.name}-${i}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span>{lng.name}</span>
                  <span className="text-xs text-white/60">{lng.proficiency}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {(data.hobbies.length > 0 || editable) && (
          <Section title={t("cv.hobbies")} dark>
            <div className="flex flex-wrap gap-1.5">
              {data.hobbies.map((h, i) => (
                <Badge
                  key={`${h}-${i}`}
                  className="border-none bg-white/10 font-normal text-white/90 hover:bg-white/15"
                >
                  {h}
                </Badge>
              ))}
            </div>
          </Section>
        )}
      </aside>

      {/* Main */}
      <main className="col-span-12 space-y-8 p-10 md:col-span-8">
        {(data.objective || editable) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              {t("cv.objective")}
            </h2>
            <p className="mt-2 border-s-2 border-teal/40 ps-4 text-sm italic leading-relaxed text-navy-600">
              <Editable
                value={data.objective}
                editable={editable}
                multiline
                onChange={(v) => patch({ objective: v })}
                placeholder="Objective…"
              />
            </p>
          </section>
        )}

        {(data.experience.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              <Briefcase className="h-3.5 w-3.5" />
              {t("cv.experience")}
            </h2>
            <ol className="mt-4 space-y-5 border-s border-navy-100 ps-6">
              {data.experience.map((exp, i) => (
                <li key={i} className="relative">
                  <span className="absolute -start-[28px] top-1.5 h-3 w-3 rounded-full border-2 border-teal bg-white" />
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-navy-900">
                      <Editable
                        value={exp.role}
                        editable={editable}
                        onChange={(v) => {
                          const next = [...data.experience];
                          next[i] = { ...next[i], role: v };
                          patch({ experience: next });
                        }}
                        placeholder="Role"
                      />
                    </h3>
                    <span className="text-xs text-navy-400">
                      <Editable
                        value={exp.duration}
                        editable={editable}
                        onChange={(v) => {
                          const next = [...data.experience];
                          next[i] = { ...next[i], duration: v };
                          patch({ experience: next });
                        }}
                        placeholder="Duration"
                      />
                    </span>
                  </div>
                  <div className="text-sm font-medium text-teal-700">
                    <Editable
                      value={exp.company}
                      editable={editable}
                      onChange={(v) => {
                        const next = [...data.experience];
                        next[i] = { ...next[i], company: v };
                        patch({ experience: next });
                      }}
                      placeholder="Company"
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-600">
                    <Editable
                      value={exp.description}
                      editable={editable}
                      multiline
                      onChange={(v) => {
                        const next = [...data.experience];
                        next[i] = { ...next[i], description: v };
                        patch({ experience: next });
                      }}
                      placeholder="Description"
                    />
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {(data.education.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("cv.education")}
            </h2>
            <ul className="mt-4 space-y-3">
              {data.education.map((edu, i) => (
                <li key={i}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold text-navy-900">
                      <Editable
                        value={edu.degree}
                        editable={editable}
                        onChange={(v) => {
                          const next = [...data.education];
                          next[i] = { ...next[i], degree: v };
                          patch({ education: next });
                        }}
                        placeholder="Degree"
                      />
                    </h3>
                    <span className="text-xs text-navy-400">
                      <Editable
                        value={edu.year}
                        editable={editable}
                        onChange={(v) => {
                          const next = [...data.education];
                          next[i] = { ...next[i], year: v };
                          patch({ education: next });
                        }}
                        placeholder="Year"
                      />
                    </span>
                  </div>
                  <div className="text-sm text-navy-600">
                    <Editable
                      value={edu.institution}
                      editable={editable}
                      onChange={(v) => {
                        const next = [...data.education];
                        next[i] = { ...next[i], institution: v };
                        patch({ education: next });
                      }}
                      placeholder="Institution"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {(data.certificates.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              <Award className="h-3.5 w-3.5" />
              {t("cv.certificates")}
            </h2>
            <ul className="mt-4 space-y-2">
              {data.certificates.map((c, i) => (
                <li key={i} className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold text-navy-900">
                      <Editable
                        value={c.name}
                        editable={editable}
                        onChange={(v) => {
                          const next = [...data.certificates];
                          next[i] = { ...next[i], name: v };
                          patch({ certificates: next });
                        }}
                        placeholder="Certificate name"
                      />
                    </span>
                    {c.issuer && (
                      <span className="ms-2 text-sm text-navy-400">
                        · <Editable
                          value={c.issuer}
                          editable={editable}
                          onChange={(v) => {
                            const next = [...data.certificates];
                            next[i] = { ...next[i], issuer: v };
                            patch({ certificates: next });
                          }}
                          placeholder="Issuer"
                        />
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-navy-400">
                    <Editable
                      value={c.year}
                      editable={editable}
                      onChange={(v) => {
                        const next = [...data.certificates];
                        next[i] = { ...next[i], year: v };
                        patch({ certificates: next });
                      }}
                      placeholder="Year"
                    />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {data.achievement && (
          <section>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
              <Trophy className="h-3.5 w-3.5" />
              {t("cv.achievement")}
            </h2>
            <div className="mt-3 space-y-2 rounded-lg border border-teal/20 bg-teal/5 p-4 text-sm text-navy-600">
              <StarRow label="S" text={data.achievement.situation} />
              <StarRow label="T" text={data.achievement.task} />
              <StarRow label="A" text={data.achievement.action} />
              <StarRow label="R" text={data.achievement.result} />
            </div>
          </section>
        )}
      </main>
    </article>
  );
}

function StarRow({ label, text }: { label: string; text: string }) {
  if (!text) return null;
  return (
    <div className="flex gap-2">
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-teal text-[10px] font-bold text-white">
        {label}
      </span>
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}

function Section({
  title,
  dark,
  children,
}: {
  title: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h3
        className={`text-xs font-bold uppercase tracking-[0.2em] ${
          dark ? "text-teal-400" : "text-teal-700"
        }`}
      >
        {title}
      </h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}
