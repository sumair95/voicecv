"use client";

/**
 * Reusable, fully-editable CV section bodies, built on the shared primitives.
 * The premium templates (Classic, Executive) compose these so each template
 * only owns its header + section-heading styling, not the field-editing logic.
 * Modern / Minimalist keep their own bespoke rendering and are untouched.
 */

import {
  Editable,
  AddButton,
  RemoveButton,
  MoveButtons,
  BulletList,
  BulletMarker,
  detectPlatform,
  shortDisplay,
  EMPTY_EXPERIENCE,
  EMPTY_EDUCATION,
  EMPTY_CERTIFICATE,
  EMPTY_LANGUAGE,
  EMPTY_SOCIAL,
} from "@/components/cv/primitives";
import { moveItem } from "@/lib/cv/reorder";
import type { CVData, SectionId } from "@/types/cv";

export interface SectionCtx {
  data: CVData;
  editable?: boolean;
  patch: (next: Partial<CVData>) => void;
  t: (key: string) => string;
}

/** Should a section render at all (has content, or we're editing)? */
export const showSection = (len: number, editable?: boolean) => len > 0 || !!editable;

export function ObjectiveContent({ data, editable, patch }: SectionCtx) {
  return (
    <p className="text-sm leading-relaxed text-navy-600">
      <Editable
        value={data.objective}
        editable={editable}
        multiline
        onChange={(v) => patch({ objective: v })}
        placeholder="…"
      />
    </p>
  );
}

export function ExperienceContent({ data, editable, patch, t }: SectionCtx) {
  return (
    <div className="space-y-4">
      {data.experience.map((exp, i) => (
        <div key={i} className="group relative pe-20">
          {editable && (
            <div className="absolute end-0 top-0 flex items-center gap-1">
              <MoveButtons
                index={i}
                count={data.experience.length}
                upLabel={t("edit.moveUp")}
                downLabel={t("edit.moveDown")}
                onMove={(to) => patch({ experience: moveItem(data.experience, i, to) })}
              />
              <RemoveButton
                label={t("edit.remove")}
                onClick={() => {
                  const n = [...data.experience];
                  n.splice(i, 1);
                  patch({ experience: n });
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
                  const n = [...data.experience];
                  n[i] = { ...n[i], role: v };
                  patch({ experience: n });
                }}
                placeholder="Role"
              />
            </h3>
            <span className="text-xs uppercase tracking-wider text-navy-400">
              <Editable
                value={exp.duration}
                editable={editable}
                onChange={(v) => {
                  const n = [...data.experience];
                  n[i] = { ...n[i], duration: v };
                  patch({ experience: n });
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
                const n = [...data.experience];
                n[i] = { ...n[i], company: v };
                patch({ experience: n });
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
                  const n = [...data.experience];
                  n[i] = { ...n[i], description: v };
                  patch({ experience: n });
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
            patch({ experience: [...data.experience, { ...EMPTY_EXPERIENCE }] })
          }
        />
      )}
    </div>
  );
}

export function EducationContent({ data, editable, patch, t }: SectionCtx) {
  return (
    <ul className="space-y-3">
      {data.education.map((edu, i) => (
        <li key={i} className="group relative pe-7">
          {editable && (
            <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
              <RemoveButton
                label={t("edit.remove")}
                onClick={() => {
                  const n = [...data.education];
                  n.splice(i, 1);
                  patch({ education: n });
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
                  const n = [...data.education];
                  n[i] = { ...n[i], degree: v };
                  patch({ education: n });
                }}
                placeholder="Degree"
              />
            </h3>
            <span className="text-xs text-navy-400">
              <Editable
                value={edu.year}
                editable={editable}
                onChange={(v) => {
                  const n = [...data.education];
                  n[i] = { ...n[i], year: v };
                  patch({ education: n });
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
                const n = [...data.education];
                n[i] = { ...n[i], institution: v };
                patch({ education: n });
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
            patch({ education: [...data.education, { ...EMPTY_EDUCATION }] })
          }
        />
      )}
    </ul>
  );
}

export function CertificatesContent({ data, editable, patch, t }: SectionCtx) {
  // Two columns when reading (matching the PDF); a single column while editing,
  // where each row needs room for its inputs and remove control.
  return (
    <ul
      className={
        editable
          ? "space-y-2"
          : "grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2"
      }
    >
      {data.certificates.map((c, i) => (
        <li key={i} className="group relative flex flex-wrap items-baseline justify-between gap-2 pe-7 text-sm">
          {editable && (
            <div className="absolute end-0 top-0 opacity-0 transition group-hover:opacity-100">
              <RemoveButton
                label={t("edit.remove")}
                onClick={() => {
                  const n = [...data.certificates];
                  n.splice(i, 1);
                  patch({ certificates: n });
                }}
              />
            </div>
          )}
          <span className="font-medium text-navy-900">
            <Editable
              value={c.name}
              editable={editable}
              onChange={(v) => {
                const n = [...data.certificates];
                n[i] = { ...n[i], name: v };
                patch({ certificates: n });
              }}
              placeholder="Certificate"
            />
            {(c.issuer || editable) && (
              <span className="text-navy-400">
                {" · "}
                <Editable
                  value={c.issuer}
                  editable={editable}
                  onChange={(v) => {
                    const n = [...data.certificates];
                    n[i] = { ...n[i], issuer: v };
                    patch({ certificates: n });
                  }}
                  placeholder="Issuer"
                />
              </span>
            )}
          </span>
          <span className="text-xs text-navy-400">
            <Editable
              value={c.year}
              editable={editable}
              onChange={(v) => {
                const n = [...data.certificates];
                n[i] = { ...n[i], year: v };
                patch({ certificates: n });
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
            patch({ certificates: [...data.certificates, { ...EMPTY_CERTIFICATE }] })
          }
        />
      )}
    </ul>
  );
}

export function SkillsContent({ data, editable, patch, t }: SectionCtx) {
  if (!editable) {
    // Three bulleted columns, mirroring the PDF. Chips wrapped raggedly and
    // carried padding on every item; columns fit the same skills in a fraction
    // of the height, which is what keeps a dense CV to two pages.
    return (
      <ul className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-sm text-navy-600 sm:grid-cols-3">
        {data.skills
          .filter((s) => s.trim())
          .map((s, i) => (
            <li key={i} className="relative ps-4 leading-snug">
              <BulletMarker />
              {s}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {data.skills.map((s, i) => (
        <span key={i} className="inline-flex max-w-full items-center gap-1 rounded-md border border-navy-100 px-2 py-0.5 text-sm">
          <Editable
            value={s}
            editable
            placeholder={t("edit.placeholder.skill")}
            onChange={(v) => {
              const n = [...data.skills];
              n[i] = v;
              patch({ skills: n });
            }}
          />
          <RemoveButton
            label={t("edit.remove")}
            onClick={() => {
              const n = [...data.skills];
              n.splice(i, 1);
              patch({ skills: n });
            }}
          />
        </span>
      ))}
      <AddButton label={t("edit.add.skill")} onClick={() => patch({ skills: [...data.skills, ""] })} />
    </div>
  );
}

export function LanguagesContent({ data, editable, patch, t }: SectionCtx) {
  if (!editable) {
    return (
      <ul className="space-y-1 text-sm text-navy-600">
        {data.languages
          .filter((l) => l.name.trim())
          .map((l, i) => (
            <li key={i}>
              <span className="font-medium text-navy-900">{l.name}</span>
              {l.proficiency ? <span className="text-navy-400"> — {l.proficiency}</span> : null}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1.5">
      {data.languages.map((l, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <Editable
            value={l.name}
            editable
            placeholder={t("edit.placeholder.langName")}
            onChange={(v) => {
              const n = [...data.languages];
              n[i] = { ...n[i], name: v };
              patch({ languages: n });
            }}
          />
          <span className="text-navy-300">—</span>
          <Editable
            value={l.proficiency}
            editable
            placeholder={t("edit.proficiency.fluent")}
            onChange={(v) => {
              const n = [...data.languages];
              n[i] = { ...n[i], proficiency: v };
              patch({ languages: n });
            }}
          />
          <RemoveButton
            label={t("edit.remove")}
            onClick={() => {
              const n = [...data.languages];
              n.splice(i, 1);
              patch({ languages: n });
            }}
          />
        </div>
      ))}
      <AddButton
        label={t("edit.add.language")}
        onClick={() => patch({ languages: [...data.languages, { ...EMPTY_LANGUAGE }] })}
      />
    </div>
  );
}

export function HobbiesContent({ data, editable, patch, t }: SectionCtx) {
  if (!editable) {
    return (
      <p className="text-sm text-navy-600">
        {data.hobbies.filter((h) => h.trim()).join(" · ")}
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {data.hobbies.map((h, i) => (
        <span key={i} className="inline-flex max-w-full items-center gap-1 rounded-md border border-navy-100 px-2 py-0.5 text-sm">
          <Editable
            value={h}
            editable
            placeholder={t("edit.placeholder.hobby")}
            onChange={(v) => {
              const n = [...data.hobbies];
              n[i] = v;
              patch({ hobbies: n });
            }}
          />
          <RemoveButton
            label={t("edit.remove")}
            onClick={() => {
              const n = [...data.hobbies];
              n.splice(i, 1);
              patch({ hobbies: n });
            }}
          />
        </span>
      ))}
      <AddButton label={t("edit.add.hobby")} onClick={() => patch({ hobbies: [...data.hobbies, ""] })} />
    </div>
  );
}

export function AchievementsContent({ data, editable, patch, t }: SectionCtx) {
  if (!editable) {
    const visible = data.achievements.filter((a) => a.trim());
    if (visible.length === 0) return null;
    return (
      <ul className="ms-5 list-none space-y-1 text-sm leading-relaxed text-navy-600">
        {visible.map((a, i) => (
          <li key={i} className="relative ps-4">
            <BulletMarker />
            {a}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-1.5">
      {data.achievements.map((a, i) => (
        <div key={i} className="flex items-center gap-1">
          <Editable
            value={a}
            editable
            className="flex-1"
            placeholder={t("edit.placeholder.achievement")}
            onChange={(v) => {
              const n = [...data.achievements];
              n[i] = v;
              patch({ achievements: n });
            }}
          />
          <RemoveButton
            label={t("edit.remove")}
            onClick={() => {
              const n = [...data.achievements];
              n.splice(i, 1);
              patch({ achievements: n });
            }}
          />
        </div>
      ))}
      <AddButton
        label={t("edit.add.achievement")}
        onClick={() => patch({ achievements: [...data.achievements, ""] })}
      />
    </div>
  );
}

/** Editable email · phone · location row used in premium headers. */
export function ContactInline({ data, editable, patch }: SectionCtx) {
  const location = [data.personal.city, data.personal.country].filter(Boolean).join(", ");
  if (!editable) {
    const bits = [data.personal.email, data.personal.phone, location].filter(Boolean);
    if (bits.length === 0) return null;
    return <span>{bits.join("  ·  ")}</span>;
  }
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-2">
      <Editable
        value={data.personal.email}
        editable
        placeholder="email@example.com"
        onChange={(v) => patch({ personal: { ...data.personal, email: v } })}
      />
      <span className="opacity-40">·</span>
      <Editable
        value={data.personal.phone}
        editable
        placeholder="+966"
        onChange={(v) => patch({ personal: { ...data.personal, phone: v } })}
      />
      <span className="opacity-40">·</span>
      <Editable
        value={location}
        editable
        placeholder="City, Country"
        onChange={(v) => {
          const idx = v.indexOf(",");
          const city = idx >= 0 ? v.slice(0, idx).trim() : v.trim();
          const country = idx >= 0 ? v.slice(idx + 1).trim() : "";
          patch({ personal: { ...data.personal, city, country } });
        }}
      />
    </span>
  );
}

/** Inline social links row. */
export function SocialsInline({ data, editable, patch, t }: SectionCtx) {
  if (!showSection(data.socials.length, editable)) return null;
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-3">
      {data.socials.map((s, i) => {
        if (!editable && !s.url.trim()) return null;
        const { Icon } = detectPlatform(s.url);
        return (
          <span key={i} className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-teal" />
            {editable ? (
              <Editable
                value={s.url}
                editable
                placeholder="https://"
                onChange={(v) => {
                  const n = [...data.socials];
                  n[i] = { url: v };
                  patch({ socials: n });
                }}
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
                  const n = [...data.socials];
                  n.splice(i, 1);
                  patch({ socials: n });
                }}
              />
            )}
          </span>
        );
      })}
      {editable && (
        <AddButton
          label={t("edit.add.social")}
          onClick={() => patch({ socials: [...data.socials, { ...EMPTY_SOCIAL }] })}
        />
      )}
    </span>
  );
}

/**
 * The eight body sections of a single-column template, keyed by id so they can
 * be rendered in the user's chosen order.
 *
 * Classic and Executive differ only in their heading treatment, so they pass
 * their own `Section` component in rather than duplicating this list. A section
 * with nothing in it stays `null` and is skipped by the renderer — which is how
 * "hide empty sections outside edit mode" keeps working unchanged.
 */
export function singleColumnBlocks(
  ctx: SectionCtx,
  Section: React.ComponentType<{ title: string; children: React.ReactNode }>,
): Partial<Record<SectionId, React.ReactNode>> {
  const { data, editable, t } = ctx;
  const wrap = (title: string, body: React.ReactNode) => (
    <Section title={title}>{body}</Section>
  );
  return {
    objective: showSection(data.objective ? 1 : 0, editable)
      ? wrap(t("cv.objective"), <ObjectiveContent {...ctx} />)
      : null,
    experience: showSection(data.experience.length, editable)
      ? wrap(t("cv.experience"), <ExperienceContent {...ctx} />)
      : null,
    education: showSection(data.education.length, editable)
      ? wrap(t("cv.education"), <EducationContent {...ctx} />)
      : null,
    certificates: showSection(data.certificates.length, editable)
      ? wrap(t("cv.certificates"), <CertificatesContent {...ctx} />)
      : null,
    skills: showSection(data.skills.length, editable)
      ? wrap(t("cv.skills"), <SkillsContent {...ctx} />)
      : null,
    languages: showSection(data.languages.length, editable)
      ? wrap(t("cv.languages"), <LanguagesContent {...ctx} />)
      : null,
    hobbies: showSection(data.hobbies.length, editable)
      ? wrap(t("cv.hobbies"), <HobbiesContent {...ctx} />)
      : null,
    achievements: showSection(data.achievements.length, editable)
      ? wrap(t("cv.achievement"), <AchievementsContent {...ctx} />)
      : null,
  };
}
