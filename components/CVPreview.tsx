"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Plus,
  X,
  Globe,
  Link as LinkIcon,
} from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import { tr } from "@/lib/i18n";
import { ClassicTemplate } from "@/components/cv/ClassicTemplate";
import { ExecutiveTemplate } from "@/components/cv/ExecutiveTemplate";
import { CvPhoto, MoveButtons } from "@/components/cv/primitives";
import { moveItem } from "@/lib/cv/reorder";
import type {
  CVCertificateItem,
  CVData,
  CVEducationItem,
  CVExperienceItem,
  CVLanguageItem,
  CVSocialLink,
  Language,
  TemplateId,
} from "@/types/cv";
import { migrateCvData } from "@/types/cv";

interface Props {
  cvData: CVData;
  language: Language;
  editable?: boolean;
  onChange?: (updated: CVData) => void;
  template?: TemplateId;
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

/**
 * Character width for an inline text input, so it is as wide as its content
 * instead of the browser's default ~20 characters. Floored so an empty field is
 * still a visible click target, capped so one long value can't blow out a
 * column. Kept in sync with the copy in `components/cv/primitives.tsx`.
 */
export function inputSize(value: string, placeholder?: string): number {
  const len = (value || placeholder || "").length;
  return Math.min(Math.max(len + 1, 6), 38);
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
  if (!editable) {
    return <span className={className}>{value || placeholder}</span>;
  }

  // Real <input>/<textarea> so the existing value is ALWAYS visible
  // in the value attribute. .cv-input forces transparent bg + inherited
  // typography; teal dashed border works on both light and dark backgrounds.
  const base =
    "cv-input rounded transition outline-none px-1 py-0.5 " +
    "border border-dashed border-teal/50 " +
    "hover:bg-teal/10 hover:border-teal " +
    "focus:bg-teal/15 focus:border-solid focus:border-teal focus:ring-2 focus:ring-teal/50 focus:font-semibold";

  if (multiline) {
    return (
      <textarea
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={3}
        spellCheck={false}
        className={[
          base,
          "block w-full resize-y min-h-[60px]",
          className ?? "",
        ].join(" ")}
      />
    );
  }

  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      spellCheck={false}
      // Width must track the CONTENT. Without an explicit `size`, a text input
      // takes the browser default of ~20 characters (~221px) no matter how
      // short the value is — so a 3-letter skill chip in the 264px Modern
      // sidebar grew wider than the column and pushed its own "remove" X past
      // the sidebar's right edge, underneath <main>. The X stayed visible
      // (nothing clips it) but <main> paints later and swallowed the click,
      // which read as "the delete cross doesn't work".
      size={inputSize(value, placeholder)}
      className={[
        base,
        "inline-block w-auto min-w-0 max-w-full",
        className ?? "",
      ].join(" ")}
    />
  );
}

function descriptionBullets(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-•*·–—]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function BulletList({ text }: { text: string }) {
  const items = descriptionBullets(text);
  if (items.length === 0) return null;
  return (
    <ul className="ms-5 mt-2 list-disc space-y-1 text-sm leading-relaxed text-navy-600 marker:text-teal">
      {items.map((line, i) => (
        <li key={i}>{line}</li>
      ))}
    </ul>
  );
}

function RemoveButton({
  onClick,
  label,
  dark,
}: {
  onClick: () => void;
  label: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full transition ${
        dark
          ? "bg-white/10 text-white/70 hover:bg-red-500/40 hover:text-white"
          : "bg-navy-50 text-navy-400 hover:bg-red-50 hover:text-red-600"
      }`}
    >
      <X className="h-3 w-3" />
    </button>
  );
}

function AddButton({
  onClick,
  label,
  dark,
}: {
  onClick: () => void;
  label: string;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
        dark
          ? "border border-dashed border-teal/60 bg-teal/10 text-teal-100 hover:bg-teal/25 hover:border-teal"
          : "border border-dashed border-teal/50 bg-teal/5 text-teal-700 hover:bg-teal/15 hover:border-teal"
      }`}
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}

const EMPTY_EXPERIENCE: CVExperienceItem = {
  company: "",
  role: "",
  duration: "",
  description: "",
};
const EMPTY_EDUCATION: CVEducationItem = {
  institution: "",
  degree: "",
  year: "",
};
const EMPTY_CERTIFICATE: CVCertificateItem = {
  name: "",
  issuer: "",
  year: "",
};
const EMPTY_LANGUAGE: CVLanguageItem = { name: "", proficiency: "" };
const EMPTY_SOCIAL: CVSocialLink = { url: "" };

function detectPlatform(url: string): {
  name: string;
  Icon: IconType | typeof Globe;
} {
  const u = url.toLowerCase();
  if (u.includes("github.com")) return { name: "GitHub", Icon: FaGithub };
  if (u.includes("linkedin.com")) return { name: "LinkedIn", Icon: FaLinkedin };
  if (u.includes("twitter.com") || u.includes("://x.com") || u.endsWith("x.com"))
    return { name: "Twitter", Icon: FaTwitter };
  if (u.includes("facebook.com") || u.includes("fb.com"))
    return { name: "Facebook", Icon: FaFacebook };
  if (u.includes("instagram.com"))
    return { name: "Instagram", Icon: FaInstagram };
  if (u.includes("youtube.com") || u.includes("youtu.be"))
    return { name: "YouTube", Icon: FaYoutube };
  if (u.length === 0) return { name: "", Icon: LinkIcon };
  return { name: "Website", Icon: Globe };
}

function shortDisplay(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}
export function CVPreview({
  cvData,
  language,
  editable,
  onChange,
  template = "modern",
}: Props) {
  // The CV preview always uses the *passed* language for all of its labels,
  // not the user's UI language. The CV view page passes "en" so the CV
  // always renders in English (for recruiter readability), independent of
  // whatever language the user chose for the app menus.
  const t = (key: string, vars?: Record<string, string | number>) =>
    tr(key, language, vars);
  const [data, setData] = useState<CVData>(() => migrateCvData(cvData));

  useEffect(() => {
    setData(migrateCvData(cvData));
  }, [cvData]);

  function patch(next: Partial<CVData>) {
    const merged = { ...data, ...next };
    setData(merged);
    onChange?.(merged);
  }

  const isRtl = language === "ar" || language === "ur";

  // ── Minimalist template ───────────────────────────────────────────
  if (template === "minimalist") {
    const location = [data.personal.city, data.personal.country]
      .filter(Boolean)
      .join(", ");
    const headerBits = [
      data.personal.email,
      data.personal.phone,
      location,
    ].filter(Boolean);

    return (
      <article
        dir={isRtl ? "rtl" : "ltr"}
        className="mx-auto w-full max-w-[210mm] bg-white p-12 shadow-sm print:shadow-none"
        style={{ minHeight: "297mm" }}
      >
        <header className="border-b border-navy-200 pb-6 text-center">
          <div
            className={
              data.personal.photo_url
                ? "mb-3 flex items-center justify-center gap-4 text-start"
                : ""
            }
          >
            {data.personal.photo_url && (
              <CvPhoto
                url={data.personal.photo_url}
              name={data.personal.full_name}
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-light tracking-wide text-navy-900">
                <Editable
                  value={data.personal.full_name}
                  editable={editable}
                  onChange={(v) =>
                    patch({ personal: { ...data.personal, full_name: v } })
                  }
                  placeholder={t("auth.fullName")}
                />
              </h1>
              {(editable || data.personal.job_title) && (
                <p className="mt-1 text-lg font-medium text-teal-600">
                  <Editable
                    value={data.personal.job_title}
                    editable={editable}
                    onChange={(v) =>
                      patch({ personal: { ...data.personal, job_title: v } })
                    }
                    placeholder={t("cv.jobTitle")}
                  />
                </p>
              )}
            </div>
          </div>
          {editable ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-navy-400">
              <Editable
                value={data.personal.email}
                editable
                onChange={(v) =>
                  patch({ personal: { ...data.personal, email: v } })
                }
                placeholder="email@example.com"
              />
              <span className="opacity-40">•</span>
              <Editable
                value={data.personal.phone}
                editable
                onChange={(v) =>
                  patch({ personal: { ...data.personal, phone: v } })
                }
                placeholder="+966"
              />
              <span className="opacity-40">•</span>
              <Editable
                value={location}
                editable
                onChange={(v) => {
                  const idx = v.indexOf(",");
                  const city = idx >= 0 ? v.slice(0, idx).trim() : v.trim();
                  const country = idx >= 0 ? v.slice(idx + 1).trim() : "";
                  patch({ personal: { ...data.personal, city, country } });
                }}
                placeholder="City, Country"
              />
            </div>
          ) : headerBits.length > 0 ? (
            <p className="mt-3 text-sm text-navy-400">
              {headerBits.join("  •  ")}
            </p>
          ) : null}
          {(data.socials.length > 0 || editable) && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-navy-400">
              {data.socials.map((s, i) => {
                if (!editable && !s.url.trim()) return null;
                const { Icon } = detectPlatform(s.url);
                return (
                  <div key={i} className="inline-flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-teal" />
                    {editable ? (
                      <Editable
                        value={s.url}
                        editable
                        onChange={(v) => {
                          const next = [...data.socials];
                          next[i] = { url: v };
                          patch({ socials: next });
                        }}
                        placeholder="https://"
                      />
                    ) : (
                      <a
                        href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-teal-700 hover:underline"
                      >
                        {shortDisplay(s.url)}
                      </a>
                    )}
                    {editable && (
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.socials];
                          next.splice(i, 1);
                          patch({ socials: next });
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {editable && (
                <AddButton
                  label={t("edit.add.social")}
                  onClick={() =>
                    patch({ socials: [...data.socials, { ...EMPTY_SOCIAL }] })
                  }
                />
              )}
            </div>
          )}
        </header>

        {(data.objective || editable) && (
          <MinSection title={t("cv.objective")}>
            <p className="text-sm leading-relaxed text-navy-600">
              <Editable
                value={data.objective}
                editable={editable}
                multiline
                onChange={(v) => patch({ objective: v })}
                placeholder="Objective…"
              />
            </p>
          </MinSection>
        )}

        {(data.experience.length > 0 || editable) && (
          <MinSection title={t("cv.experience")}>
            <div className="space-y-5">
              {data.experience.map((exp, i) => (
                <div key={i} className="group relative pe-20">
                  {editable && (
                    <div className="absolute end-0 top-0 flex items-center gap-1">
                      <MoveButtons
                        index={i}
                        count={data.experience.length}
                        upLabel={t("edit.moveUp")}
                        downLabel={t("edit.moveDown")}
                        onMove={(to) =>
                          patch({ experience: moveItem(data.experience, i, to) })
                        }
                      />
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.experience];
                          next.splice(i, 1);
                          patch({ experience: next });
                        }}
                      />
                    </div>
                  )}
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
                    <span className="text-xs uppercase tracking-wider text-navy-400">
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
                  <div className="text-sm text-teal-700">
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
                  {editable ? (
                    <div className="mt-2">
                      <Editable
                        value={exp.description}
                        editable
                        multiline
                        onChange={(v) => {
                          const next = [...data.experience];
                          next[i] = { ...next[i], description: v };
                          patch({ experience: next });
                        }}
                        placeholder={t("edit.hint.bullets")}
                      />
                    </div>
                  ) : (
                    <BulletList text={exp.description} />
                  )}
                </div>
              ))}
              {editable && (
                <AddButton
                  label={t("edit.add.experience")}
                  onClick={() =>
                    patch({
                      experience: [...data.experience, { ...EMPTY_EXPERIENCE }],
                    })
                  }
                />
              )}
            </div>
          </MinSection>
        )}

        {(data.education.length > 0 || editable) && (
          <MinSection title={t("cv.education")}>
            <ul className="space-y-3">
              {data.education.map((edu, i) => (
                <li key={i} className="group relative pe-7">
                  {editable && (
                    <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.education];
                          next.splice(i, 1);
                          patch({ education: next });
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-navy-900">
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
              {editable && (
                <AddButton
                  label={t("edit.add.education")}
                  onClick={() =>
                    patch({
                      education: [...data.education, { ...EMPTY_EDUCATION }],
                    })
                  }
                />
              )}
            </ul>
          </MinSection>
        )}

        {(data.certificates.length > 0 || editable) && (
          <MinSection title={t("cv.certificates")}>
            <ul className="space-y-2">
              {data.certificates.map((c, i) => (
                <li
                  key={i}
                  className="group relative flex flex-wrap items-baseline justify-between gap-2 pe-7"
                >
                  {editable && (
                    <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.certificates];
                          next.splice(i, 1);
                          patch({ certificates: next });
                        }}
                      />
                    </div>
                  )}
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
                    {(c.issuer || editable) && (
                      <span className="ms-2 text-sm text-navy-400">
                        ·{" "}
                        <Editable
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
              {editable && (
                <AddButton
                  label={t("edit.add.certificate")}
                  onClick={() =>
                    patch({
                      certificates: [
                        ...data.certificates,
                        { ...EMPTY_CERTIFICATE },
                      ],
                    })
                  }
                />
              )}
            </ul>
          </MinSection>
        )}

        {(data.skills.length > 0 || editable) && (
          <MinSection title={t("cv.skills")}>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => {
                if (!editable && !skill.trim()) return null;
                return (
                  <div
                    key={i}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-navy-100 px-2 py-0.5 text-sm text-navy-700"
                  >
                    <Editable
                      value={skill}
                      editable={editable}
                      placeholder={t("edit.placeholder.skill")}
                      onChange={(v) => {
                        const next = [...data.skills];
                        next[i] = v;
                        patch({ skills: next });
                      }}
                    />
                    {editable && (
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.skills];
                          next.splice(i, 1);
                          patch({ skills: next });
                        }}
                      />
                    )}
                  </div>
                );
              })}
              {editable && (
                <AddButton
                  label={t("edit.add.skill")}
                  onClick={() => patch({ skills: [...data.skills, ""] })}
                />
              )}
            </div>
          </MinSection>
        )}

        {(data.languages.length > 0 || editable) && (
          <MinSection title={t("cv.languages")}>
            <ul className="grid grid-cols-2 gap-y-1 text-sm text-navy-700">
              {data.languages.map((lng, i) => {
                if (!editable && !lng.name.trim()) return null;
                return (
                  <li key={i} className="flex items-center gap-2">
                    <Editable
                      value={lng.name}
                      editable={editable}
                      placeholder={t("edit.placeholder.langName")}
                      onChange={(v) => {
                        const next = [...data.languages];
                        next[i] = { ...next[i], name: v };
                        patch({ languages: next });
                      }}
                    />
                    {editable ? (
                      <select
                        value={lng.proficiency}
                        onChange={(e) => {
                          const next = [...data.languages];
                          next[i] = { ...next[i], proficiency: e.target.value };
                          patch({ languages: next });
                        }}
                        className="rounded border border-navy-100 px-1 text-xs text-navy-700"
                      >
                        <option value="">—</option>
                        <option value={t("edit.proficiency.beginner")}>
                          {t("edit.proficiency.beginner")}
                        </option>
                        <option value={t("edit.proficiency.conversational")}>
                          {t("edit.proficiency.conversational")}
                        </option>
                        <option value={t("edit.proficiency.fluent")}>
                          {t("edit.proficiency.fluent")}
                        </option>
                      </select>
                    ) : (
                      <span className="text-xs text-navy-400">
                        — {lng.proficiency}
                      </span>
                    )}
                    {editable && (
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.languages];
                          next.splice(i, 1);
                          patch({ languages: next });
                        }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
            {editable && (
              <AddButton
                label={t("edit.add.language")}
                onClick={() =>
                  patch({
                    languages: [...data.languages, { ...EMPTY_LANGUAGE }],
                  })
                }
              />
            )}
          </MinSection>
        )}

        {(data.hobbies.length > 0 || editable) && (
          <MinSection title={t("cv.hobbies")}>
            <p className="text-sm text-navy-600">
              {(() => {
                if (!editable) {
                  return data.hobbies.filter((h) => h.trim()).join(" · ");
                }
                return null;
              })()}
            </p>
            {editable && (
              <div className="flex flex-wrap gap-1.5">
                {data.hobbies.map((h, i) => (
                  <div
                    key={i}
                    className="inline-flex max-w-full items-center gap-1 rounded-md border border-navy-100 px-2 py-0.5 text-sm text-navy-700"
                  >
                    <Editable
                      value={h}
                      editable
                      placeholder={t("edit.placeholder.hobby")}
                      onChange={(v) => {
                        const next = [...data.hobbies];
                        next[i] = v;
                        patch({ hobbies: next });
                      }}
                    />
                    <RemoveButton
                      label={t("edit.remove")}
                      onClick={() => {
                        const next = [...data.hobbies];
                        next.splice(i, 1);
                        patch({ hobbies: next });
                      }}
                    />
                  </div>
                ))}
                <AddButton
                  label={t("edit.add.hobby")}
                  onClick={() => patch({ hobbies: [...data.hobbies, ""] })}
                />
              </div>
            )}
          </MinSection>
        )}

        {(data.achievements.length > 0 || editable) && (
          <MinSection title={t("cv.achievement")}>
            <div className="text-sm text-navy-600">
              <AchievementsList
                items={data.achievements}
                editable={editable}
                t={t}
                onChange={(next) => patch({ achievements: next })}
              />
            </div>
          </MinSection>
        )}
      </article>
    );
  }

  // ── Premium templates ─────────────────────────────────────────────
  if (template === "classic") {
    return (
      <ClassicTemplate data={data} editable={editable} patch={patch} t={t} isRtl={isRtl} />
    );
  }
  if (template === "executive") {
    return (
      <ExecutiveTemplate data={data} editable={editable} patch={patch} t={t} isRtl={isRtl} />
    );
  }

  // ── Modern template (default) ────────────────────────────────────
  return (
    <article
      dir={isRtl ? "rtl" : "ltr"}
      className="mx-auto grid w-full max-w-[210mm] grid-cols-12 overflow-hidden rounded-xl border border-navy-100/60 bg-white shadow-sm print:shadow-none"
      style={{ minHeight: "297mm" }}
    >
      {/* Sidebar */}
      <aside className="col-span-12 bg-navy-900 p-8 text-white md:col-span-4">
        <div className="flex flex-col items-center gap-3 text-center">
          {data.personal.photo_url ? (
            <CvPhoto
              url={data.personal.photo_url}
              name={data.personal.full_name}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-teal-300"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-teal text-2xl font-bold text-white">
              {initialsOf(data.personal.full_name)}
            </div>
          )}
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
          {(editable || data.personal.job_title) && (
            <p className="text-sm font-medium text-teal-300">
              <Editable
                value={data.personal.job_title}
                editable={editable}
                onChange={(v) =>
                  patch({ personal: { ...data.personal, job_title: v } })
                }
                placeholder={t("cv.jobTitle")}
              />
            </p>
          )}
          {(data.personal.city || data.personal.country || editable) && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-sm text-white/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {editable ? (
                <Editable
                  value={[data.personal.city, data.personal.country]
                    .filter(Boolean)
                    .join(", ")}
                  editable
                  placeholder={`${t("edit.placeholder.city")}, ${t("edit.placeholder.country")}`}
                  onChange={(v) => {
                    const trimmed = v.trim();
                    const idx = trimmed.indexOf(",");
                    const city = idx >= 0 ? trimmed.slice(0, idx).trim() : trimmed;
                    const country = idx >= 0 ? trimmed.slice(idx + 1).trim() : "";
                    patch({
                      personal: { ...data.personal, city, country },
                    });
                  }}
                />
              ) : (
                <span>
                  {[data.personal.city, data.personal.country]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="my-6 h-px bg-white/10" />

        {/* Contact */}
        <Section title={t("cv.contact")} dark>
          {(data.personal.email || editable) && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-3.5 w-3.5 shrink-0 text-teal-400" />
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
              <Phone className="h-3.5 w-3.5 shrink-0 text-teal-400" />
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
          {data.socials.map((s, i) => {
            if (!editable && !s.url.trim()) return null;
            const { Icon } = detectPlatform(s.url);
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                <Icon className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                {editable ? (
                  <Editable
                    value={s.url}
                    editable
                    onChange={(v) => {
                      const next = [...data.socials];
                      next[i] = { url: v };
                      patch({ socials: next });
                    }}
                    placeholder={t("edit.placeholder.socialUrl")}
                    className="text-white/90"
                  />
                ) : (
                  <a
                    href={s.url.startsWith("http") ? s.url : `https://${s.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-white/90 hover:text-teal-200 hover:underline"
                  >
                    {shortDisplay(s.url)}
                  </a>
                )}
                {editable && (
                  <RemoveButton
                    dark
                    label={t("edit.remove")}
                    onClick={() => {
                      const next = [...data.socials];
                      next.splice(i, 1);
                      patch({ socials: next });
                    }}
                  />
                )}
              </div>
            );
          })}
          {editable && (
            <AddButton
              dark
              label={t("edit.add.social")}
              onClick={() =>
                patch({ socials: [...data.socials, { ...EMPTY_SOCIAL }] })
              }
            />
          )}
        </Section>

        {/* Skills */}
        {(data.skills.length > 0 || editable) && (
          <Section title={t("cv.skills")} dark>
            <div className="flex flex-wrap gap-1.5">
              {data.skills.map((skill, i) => {
                if (!editable && !skill.trim()) return null;
                return (
                  <div
                    key={i}
                    className="inline-flex max-w-full items-center gap-1 rounded-md bg-teal/20 px-2 py-0.5"
                  >
                    <Editable
                      value={skill}
                      editable={editable}
                      placeholder={t("edit.placeholder.skill")}
                      onChange={(v) => {
                        const next = [...data.skills];
                        next[i] = v;
                        patch({ skills: next });
                      }}
                      className="text-xs text-teal-100"
                    />
                    {editable && (
                      <RemoveButton
                        dark
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.skills];
                          next.splice(i, 1);
                          patch({ skills: next });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {editable && (
              <AddButton
                dark
                label={t("edit.add.skill")}
                onClick={() => patch({ skills: [...data.skills, ""] })}
              />
            )}
          </Section>
        )}

        {/* Languages */}
        {(data.languages.length > 0 || editable) && (
          <Section title={t("cv.languages")} dark>
            <ul className="space-y-1.5 text-sm text-white/90">
              {data.languages.map((lng, i) => {
                if (!editable && !lng.name.trim()) return null;
                return (
                <li key={i} className="flex items-center gap-2">
                  <Editable
                    value={lng.name}
                    editable={editable}
                    placeholder={t("edit.placeholder.langName")}
                    onChange={(v) => {
                      const next = [...data.languages];
                      next[i] = { ...next[i], name: v };
                      patch({ languages: next });
                    }}
                    className="flex-1"
                  />
                  {editable ? (
                    <select
                      value={lng.proficiency}
                      onChange={(e) => {
                        const next = [...data.languages];
                        next[i] = { ...next[i], proficiency: e.target.value };
                        patch({ languages: next });
                      }}
                      className="rounded border border-white/20 bg-navy-900 px-1.5 py-0.5 text-xs text-white/90"
                    >
                      <option value="">—</option>
                      <option value={t("edit.proficiency.beginner")}>
                        {t("edit.proficiency.beginner")}
                      </option>
                      <option value={t("edit.proficiency.conversational")}>
                        {t("edit.proficiency.conversational")}
                      </option>
                      <option value={t("edit.proficiency.fluent")}>
                        {t("edit.proficiency.fluent")}
                      </option>
                    </select>
                  ) : (
                    <span className="text-xs text-white/60">
                      {lng.proficiency}
                    </span>
                  )}
                  {editable && (
                    <RemoveButton
                      dark
                      label={t("edit.remove")}
                      onClick={() => {
                        const next = [...data.languages];
                        next.splice(i, 1);
                        patch({ languages: next });
                      }}
                    />
                  )}
                </li>
                );
              })}
            </ul>
            {editable && (
              <AddButton
                dark
                label={t("edit.add.language")}
                onClick={() =>
                  patch({ languages: [...data.languages, { ...EMPTY_LANGUAGE }] })
                }
              />
            )}
          </Section>
        )}

        {/* Hobbies */}
        {(data.hobbies.length > 0 || editable) && (
          <Section title={t("cv.hobbies")} dark>
            <div className="flex flex-wrap gap-1.5">
              {data.hobbies.map((h, i) => {
                if (!editable && !h.trim()) return null;
                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-0.5"
                  >
                    <Editable
                      value={h}
                      editable={editable}
                      placeholder={t("edit.placeholder.hobby")}
                      onChange={(v) => {
                        const next = [...data.hobbies];
                        next[i] = v;
                        patch({ hobbies: next });
                      }}
                      className="text-xs text-white/90"
                    />
                    {editable && (
                      <RemoveButton
                        dark
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.hobbies];
                          next.splice(i, 1);
                          patch({ hobbies: next });
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {editable && (
              <AddButton
                dark
                label={t("edit.add.hobby")}
                onClick={() => patch({ hobbies: [...data.hobbies, ""] })}
              />
            )}
          </Section>
        )}
      </aside>

      {/* Main */}
      <main className="col-span-12 space-y-8 p-10 md:col-span-8">
        {/* Objective */}
        {(data.objective || editable) && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
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

        {/* Experience */}
        {(data.experience.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              <Briefcase className="h-3.5 w-3.5" />
              {t("cv.experience")}
            </h2>
            <ol className="mt-4 space-y-5 border-s border-navy-100 ps-6">
              {data.experience.map((exp, i) => (
                <li key={i} className="group relative">
                  <span className="absolute -start-[28px] top-1.5 h-3 w-3 rounded-full border-2 border-teal bg-white" />
                  {editable && (
                    <div className="absolute end-0 top-0 flex items-center gap-1">
                      <MoveButtons
                        index={i}
                        count={data.experience.length}
                        upLabel={t("edit.moveUp")}
                        downLabel={t("edit.moveDown")}
                        onMove={(to) =>
                          patch({ experience: moveItem(data.experience, i, to) })
                        }
                      />
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.experience];
                          next.splice(i, 1);
                          patch({ experience: next });
                        }}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap items-baseline justify-between gap-2 pe-20">
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
                  {editable ? (
                    <div className="mt-2">
                      <p className="whitespace-pre-line text-sm leading-relaxed text-navy-600">
                        <Editable
                          value={exp.description}
                          editable
                          multiline
                          onChange={(v) => {
                            const next = [...data.experience];
                            next[i] = { ...next[i], description: v };
                            patch({ experience: next });
                          }}
                          placeholder={t("edit.hint.bullets")}
                        />
                      </p>
                      <p className="mt-1 text-xs italic text-navy-400">
                        {t("edit.hint.bullets")}
                      </p>
                    </div>
                  ) : (
                    <BulletList text={exp.description} />
                  )}
                </li>
              ))}
            </ol>
            {editable && (
              <div className="mt-3 ps-6">
                <AddButton
                  label={t("edit.add.experience")}
                  onClick={() =>
                    patch({
                      experience: [...data.experience, { ...EMPTY_EXPERIENCE }],
                    })
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Education */}
        {(data.education.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              <GraduationCap className="h-3.5 w-3.5" />
              {t("cv.education")}
            </h2>
            <ul className="mt-4 space-y-4 border-s border-navy-100 ps-6">
              {data.education.map((edu, i) => (
                <li key={i} className="group relative pe-7">
                  <span className="absolute -start-[28px] top-1.5 h-3 w-3 rounded-full border-2 border-teal bg-white" />
                  {editable && (
                    <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.education];
                          next.splice(i, 1);
                          patch({ education: next });
                        }}
                      />
                    </div>
                  )}
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
            {editable && (
              <div className="mt-3 ps-6">
                <AddButton
                  label={t("edit.add.education")}
                  onClick={() =>
                    patch({
                      education: [...data.education, { ...EMPTY_EDUCATION }],
                    })
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Certificates */}
        {(data.certificates.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              <Award className="h-3.5 w-3.5" />
              {t("cv.certificates")}
            </h2>
            <ul className="mt-4 space-y-3 border-s border-navy-100 ps-6">
              {data.certificates.map((c, i) => (
                <li
                  key={i}
                  className="group relative flex flex-wrap items-baseline justify-between gap-2 pe-7"
                >
                  <span className="absolute -start-[28px] top-1.5 h-3 w-3 rounded-full border-2 border-teal bg-white" />
                  {editable && (
                    <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
                      <RemoveButton
                        label={t("edit.remove")}
                        onClick={() => {
                          const next = [...data.certificates];
                          next.splice(i, 1);
                          patch({ certificates: next });
                        }}
                      />
                    </div>
                  )}
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
                    {(c.issuer || editable) && (
                      <span className="ms-2 text-sm text-navy-400">
                        ·{" "}
                        <Editable
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
            {editable && (
              <div className="mt-3 ps-6">
                <AddButton
                  label={t("edit.add.certificate")}
                  onClick={() =>
                    patch({
                      certificates: [
                        ...data.certificates,
                        { ...EMPTY_CERTIFICATE },
                      ],
                    })
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Achievements */}
        {(data.achievements.length > 0 || editable) && (
          <section>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-teal-700">
              <Trophy className="h-3.5 w-3.5" />
              {t("cv.achievement")}
            </h2>
            <div className="mt-3 rounded-lg border border-teal/20 bg-teal/5 p-4 text-sm text-navy-600">
              <AchievementsList
                items={data.achievements}
                editable={editable}
                t={t}
                onChange={(next) => patch({ achievements: next })}
              />
            </div>
          </section>
        )}
      </main>
    </article>
  );
}

function AchievementsList({
  items,
  editable,
  onChange,
  t,
}: {
  items: string[];
  editable?: boolean;
  onChange: (next: string[]) => void;
  t: (key: string) => string;
}) {
  if (!editable) {
    const visible = items.filter((a) => a.trim());
    if (visible.length === 0) return null;
    return (
      <ul className="ms-5 list-disc space-y-1 leading-relaxed marker:text-teal">
        {visible.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1.5">
      {items.map((a, i) => (
        <div key={i} className="flex items-center gap-1">
          <Editable
            value={a}
            editable
            className="flex-1"
            placeholder={t("edit.placeholder.achievement")}
            onChange={(v) => {
              const next = [...items];
              next[i] = v;
              onChange(next);
            }}
          />
          <RemoveButton
            label={t("edit.remove")}
            onClick={() => {
              const next = [...items];
              next.splice(i, 1);
              onChange(next);
            }}
          />
        </div>
      ))}
      <AddButton
        label={t("edit.add.achievement")}
        onClick={() => onChange([...items, ""])}
      />
    </div>
  );
}

function MinSection({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-baseline justify-between border-b border-navy-100 pb-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.25em] text-teal-700">
          {title}
        </h2>
        {right}
      </div>
      <div className="mt-3">{children}</div>
    </section>
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
        className={`text-sm font-bold uppercase tracking-[0.2em] ${
          dark ? "text-teal-400" : "text-teal-700"
        }`}
      >
        {title}
      </h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}
