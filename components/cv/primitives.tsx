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

import {
  Plus,
  X,
  Globe,
  Link as LinkIcon,
  ChevronUp,
  ChevronDown,
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

/**
 * Optional CV photo. Renders nothing unless a URL is present (opt-in per CV).
 * Sizing/shape comes from the caller via `className` so each template can frame
 * it to taste.
 *
 * Deliberately a raw `<img>` rather than `next/image` (L5). The src is a
 * short-lived signed URL for a private storage object (H4); routing it through
 * `/_next/image` would copy each headshot into Next's on-disk optimisation
 * cache and serve it from a CDN-cacheable URL that outlives the signature —
 * re-opening exactly the exposure migration 027 closed. `width`/`height` below
 * reserve the box, which is the layout-shift benefit we actually wanted here.
 */
export function CvPhoto({
  url,
  name,
  className,
}: {
  url?: string;
  name?: string;
  className?: string;
}) {
  if (!url) return null;
  return (
    // Anchor to the top so the head is never clipped when the photo fills a
    // round frame — the body's bottom edge is what the frame crops instead.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      // The photo carries identity — it is not decoration, so it needs a real
      // name rather than the empty alt this used to have (L3).
      alt={name?.trim() ? `${name.trim()} — photo` : "Profile photo"}
      width={320}
      height={400}
      className={`${className ?? ""} object-top`}
    />
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
/**
 * Character width for an inline text input, so it is as wide as its content
 * instead of the browser's default ~20 characters. Floored so an empty field is
 * still a visible click target, capped so one long value can't blow out a
 * column. Kept in sync with the copy in `components/CVPreview.tsx`.
 */
export function inputSize(value: string, placeholder?: string): number {
  const len = (value || placeholder || "").length;
  return Math.min(Math.max(len + 1, 6), 38);
}

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
      // See `inputSize` above. Without an explicit size the input is ~20
      // characters wide whatever it holds, which pushed skill chips out of
      // their column and left the remove X under a sibling that ate the click.
      size={inputSize(value, placeholder)}
      className={[
        base,
        "inline-block w-auto min-w-0 max-w-full",
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

/**
 * ↑/↓ reorder controls for one entry in a list section.
 *
 * Rendered for every entry (not just on hover) because on a touch screen there
 * is no hover — the existing hover-only remove button is already hard to reach
 * on mobile, and this is the control a user reaches for most.
 */
export function MoveButtons({
  index,
  count,
  onMove,
  upLabel,
  downLabel,
  dark,
}: {
  index: number;
  count: number;
  /** Called with the destination index. */
  onMove: (to: number) => void;
  upLabel: string;
  downLabel: string;
  dark?: boolean;
}) {
  if (count < 2) return null;
  const tone = dark
    ? "bg-white/10 text-white/70 hover:bg-teal/50 hover:text-white disabled:opacity-25"
    : "bg-navy-50 text-navy-400 hover:bg-teal/20 hover:text-teal-700 disabled:opacity-30";
  const cls = `grid h-5 w-5 shrink-0 place-items-center rounded-full transition disabled:cursor-not-allowed ${tone}`;
  return (
    <>
      <button
        type="button"
        onClick={() => onMove(index - 1)}
        disabled={index === 0}
        aria-label={upLabel}
        title={upLabel}
        className={cls}
      >
        <ChevronUp className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => onMove(index + 1)}
        disabled={index === count - 1}
        aria-label={downLabel}
        title={downLabel}
        className={cls}
      >
        <ChevronDown className="h-3 w-3" />
      </button>
    </>
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
/**
 * Hollow teal ring used for every bullet in the document, so detail bullets
 * speak the same visual language as the larger ring that marks each timeline
 * entry. `list-disc` markers can't be made hollow, hence the explicit span.
 *
 * `top-[0.6em]` centres the ring on the first line's text regardless of font
 * size, and it stays put when the item wraps to several lines.
 */
export function BulletMarker() {
  return (
    <span
      aria-hidden
      className="absolute start-0 top-[0.6em] h-1.5 w-1.5 -translate-y-1/2 rounded-full border border-teal"
    />
  );
}

export function BulletList({ text }: { text: string }) {
  const items = descriptionBullets(text);
  if (items.length === 0) return null;
  return (
    <ul className="ms-5 mt-2 list-none space-y-1 text-sm leading-relaxed text-navy-600">
      {items.map((line, i) => (
        <li key={i} className="relative ps-4">
          <BulletMarker />
          {line}
        </li>
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
