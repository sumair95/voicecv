"use client";

/**
 * Shared building blocks used by every CV template layout.
 *
 * `Editable` is the real <input>/<textarea> with the dashed-teal affordance;
 * `AddButton`/`RemoveButton` are the small pill controls; `BulletList`
 * renders the experience description as bullets; `MinSection` is the
 * Minimalist title block.
 *
 * Helpers: `descriptionBullets` parses bullet lines, `detectPlatform`
 * picks the right brand icon for a social URL, `shortDisplay` strips
 * scheme/www from a URL for compact display, `initialsOf` builds
 * 2-char initials for an avatar.
 */

import { Plus, X, Globe, Link as LinkIcon } from "lucide-react";
import type { IconType } from "react-icons";
import {
  FaGithub,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";
import type {
  CVCertificateItem,
  CVEducationItem,
  CVExperienceItem,
  CVLanguageItem,
  CVSocialLink,
} from "@/types/cv";

// ───── Empty-value seeds (used by Add buttons) ─────────────────────
export const EMPTY_EXPERIENCE: CVExperienceItem = {
  company: "",
  role: "",
  duration: "",
  description: "",
};
export const EMPTY_EDUCATION: CVEducationItem = {
  institution: "",
  degree: "",
  year: "",
};
export const EMPTY_CERTIFICATE: CVCertificateItem = {
  name: "",
  issuer: "",
  year: "",
};
export const EMPTY_LANGUAGE: CVLanguageItem = { name: "", proficiency: "" };
export const EMPTY_SOCIAL: CVSocialLink = { url: "" };

// ───── Helpers ─────────────────────────────────────────────────────
export function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

export function descriptionBullets(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((line) => line.replace(/^\s*[-•*·–—]\s*/, "").trim())
    .filter((line) => line.length > 0);
}

export function detectPlatform(url: string): {
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

export function shortDisplay(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return (u.hostname.replace(/^www\./, "") + u.pathname).replace(/\/$/, "");
  } catch {
    return url;
  }
}

// ───── Editable input ──────────────────────────────────────────────
export function Editable({
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
      className={[
        base,
        "inline-block w-auto min-w-[60px] max-w-full",
        className ?? "",
      ].join(" ")}
    />
  );
}

// ───── Add / Remove controls ───────────────────────────────────────
export function RemoveButton({
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

export function AddButton({
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

// ───── Render helpers ──────────────────────────────────────────────
export function BulletList({ text }: { text: string }) {
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

// ───── Section title blocks ────────────────────────────────────────
export function Section({
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

export function MinSection({
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
