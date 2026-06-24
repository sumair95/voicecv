# VoiceCV — Worklog

Chronological build log for the Kanz AI Hackathon (July 13–20, 2026).

## 2026-06-24 — Custom domain + delete-CV feature
- **Domain:** Sumair purchased `vocv.app` and pointed it at the Railway deploy (DNS auto-configured by Railway, SSL auto-provisioned — `.app` is HSTS-preload so HTTPS-only). `NEXT_PUBLIC_APP_URL` → `https://vocv.app`; Supabase Site URL + redirect URLs updated to the domain.
- **Deploy fix:** dropped hardcoded `-p 3001` from `package.json` `start` so Railway binds its injected `$PORT` (commit on `main`). Local `npm run dev` still pinned to 3001.
- **Delete CV (new feature):** dashboard CV cards get a trash button → inline "Delete this CV?" confirm overlay → optimistic removal + toast. Row delete via existing `own cvs` RLS policy (already `for all`, covers DELETE). No migration. Investigated storage cleanup: `audio_url` is never populated and there's no upload code, so no orphaned recordings to clean. New i18n keys `dashboard.delete*` in EN/AR/UR. `tsc --noEmit` + `next lint` clean.

## 2026-05-30 — Day 0: Foundation
- Scaffolded Next.js 14 (App Router, TypeScript, Tailwind) at `C:\Users\admin\AI Agent\voicecv`.
- Installed deps: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `openai`, `@react-pdf/renderer`, `framer-motion`, `react-hook-form`, `zod`, `@hookform/resolvers`, `canvas-confetti`.
- Initialized shadcn/ui; added `button`, `card`, `badge`, `progress`, `sonner` (toast replacement), `avatar`, `separator`, `input`, `label`, `textarea`.
- Created directory structure: `app/(auth)`, `app/(dashboard)`, `app/api/{transcribe,generate-cv,export-pdf,cvs}`, `components`, `lib/supabase`, `types`, `supabase`.
- Wrote `supabase/schema.sql` (profiles, cvs, questions, RLS, auto-profile trigger, recordings storage bucket).
- Wrote `.env.example` and `.env.local` (empty placeholders).
- Build order chosen: types → landing → Supabase → auth → dashboard → recorder → APIs → CV view → PDF → polish.

### Decision notes
- **Claude model:** Doc specifies `claude-sonnet-4-20250514` (older naming). Using current latest `claude-sonnet-4-6` for better quality + lower cost.
- **shadcn toasts:** `toast` was deprecated → using `sonner` (shadcn's current recommendation).
- **`@supabase/ssr`** for App Router compatibility (replaces deprecated `auth-helpers-nextjs`).
- **Button component:** shadcn's current registry ships a `@base-ui/react/button` variant without `asChild`. Replaced with the classic radix-slot version so `<Button asChild><Link/></Button>` works.

### Built today
- Landing page (`app/page.tsx`) — hero, phone mockup, stats, how-it-works, testimonials, CTA, footer. Bilingual EN/AR with RTL flip.
- LanguageProvider context + Navbar + LanguageToggle.
- Auth: login + signup pages with Supabase email/password and Google OAuth, OAuth callback at `/auth/callback`.
- Onboarding language picker.
- Middleware: redirects unauthenticated users away from `/dashboard /record /cv /onboarding`; sends already-authed users away from auth pages.
- Dashboard: empty state + CV grid with status badges.
- VoiceRecorder component: MediaRecorder + Web Audio waveform (24 bars), 2-min cap, accessible aria-live, pulse-ring animation.
- /api/transcribe (Whisper-1, language-aware).
- /api/generate-cv (Claude, JSON-only output, inserts/updates `cvs` row).
- Record page: language pick → progressive question flow → animated processing → confetti success.
- CVPreview: 2-column print-ready layout, inline contenteditable in edit mode, debounced auto-save, RTL flip.
- CV view/edit page with Download PDF + Edit/Done toggle.
- /api/export-pdf using @react-pdf/renderer with embedded Inter + Noto Sans Arabic fonts.
- README rewrite, CHANGELOG, NEXT_STEPS, .env.example, .gitignore tightened.

### Validation
- `tsc --noEmit` clean.
- `next build` succeeds: 14 routes (6 static, 4 server-rendered, 4 API).

## 2026-06-01 — Day 1: Local boot + GitHub + Railway prep

### Done
- Sumair pasted real keys into `.env.local`: Supabase URL/anon/service_role, Anthropic, OpenAI. (.env.local is in `.gitignore` — never committed.)
- Changed dev/start port to **3001** so VoiceCV runs alongside HomeBite (port 3000).
  - `package.json` scripts: `"dev": "next dev -p 3001"`, `"start": "next start -p 3001"`
  - Updated `NEXT_PUBLIC_APP_URL=http://localhost:3001` in `.env.local`, `.env.example`, README, NEXT_STEPS.
- `npm run dev` boots cleanly on http://localhost:3001 (Ready in ~1.6s).
- Initialized git in `voicecv/` (own repo, branch `main`).
- Created **private GitHub repo:** https://github.com/sumair95/voicecv
  - Pushed via `gh repo create sumair95/voicecv --private --source . --remote origin --push`
  - Verified `.env.local` excluded; only `.env.example` is tracked.
- Decided deployment target: **Railway** (matches doc + Sumair's existing $5 Hobby plan).

### Pending UI steps Sumair is doing in browser
1. Supabase SQL Editor → paste `supabase/schema.sql` → Run.
2. Supabase → Auth → URL Configuration:
   - Site URL: `http://localhost:3001` (will be replaced with Railway URL after step 4).
   - Redirect URLs: add `http://localhost:3001/auth/callback`.
3. Supabase → Auth → Providers → Email → toggle off "Confirm email" for hackathon dev speed (optional).
4. Railway → New Project → Deploy from GitHub repo `sumair95/voicecv`.
   - Paste env vars (all 6) into Variables → Raw Editor.
   - Settings → Networking → Generate Domain.
   - Update `NEXT_PUBLIC_APP_URL` env var to the Railway domain.
   - Add Railway domain to Supabase Site URL + Redirect URLs.

### Decision notes
- Picked Railway over Vercel: matches doc plan; Sumair already pays for it; one URL for the whole hackathon week.
- Pinned port to 3001 instead of letting Next auto-pick: prevents the dev-server URL from drifting and lets Supabase Site URL be static.

### Brand
- Replaced "Powered by Claude AI" attribution with **"Developed by DevVibe AI"** (Arabic: "من تطوير DevVibe AI") in `lib/i18n.ts`. Surfaces in hero badge + footer.

## 2026-06-02 — Day 2: Question set v2 + 4 languages

### Done
- Expanded supported languages: **English, Arabic, Urdu, Hindi** (was EN+AR). RTL handling now covers `ar` and `ur`; Hindi is LTR.
- Expanded the recording flow from **5 → 9 questions**:
  1. `personal` — full name, nationality, city, mobile, email
  2. `recent_job` — most recent/current job
  3. `previous_roles` — earlier roles (any duration)
  4. `skills` — specific skills, tools, equipment, licences, software
  5. `spoken_languages` — languages + proficiency (beginner/conversational/fluent)
  6. `education` — highest level + institution
  7. `certificates` — certificates / training courses
  8. `hobbies` — hobbies / interests
  9. `achievement` — optional STAR-method work achievement
- All 9 questions × 4 languages = **36 question rows** seeded (`supabase/migrations/002_questions_v2.sql` for existing projects, also baked into `supabase/schema.sql` for fresh projects).
- Hindi translations for Q6–Q9 written by Claude (Sumair's spec didn't include them).

### Code changes
- `types/cv.ts` — Language type = `en | ar | ur | hi`. Added `nationality` to CVPersonal. New CVData fields: `certificates`, `hobbies`, `achievement (STAR)`. Languages now `{ name, proficiency }`. EMPTY_CV updated.
- `lib/i18n.ts` — every key gets EN/AR/UR/HI; added `cv.certificates`, `cv.hobbies`, `cv.achievement`, `cv.nationality`, `rec.skip` and updated `landing.subhead` to mention all 4 langs.
- `lib/whisper.ts` — pass Language directly to Whisper (it supports ar/en/ur/hi natively).
- `lib/claude.ts` — language name map (en→English, ar→Arabic, ur→Urdu, hi→Hindi), new SYSTEM_PROMPT with the v2 JSON schema + field_key→section mapping. Backfills sparse responses with empty defaults.
- `lib/pdf-generator.tsx` — registered NotoUrdu (Nastaliq) + NotoDevanagari fonts. Font picked per-language. SECTION_LABELS for all 4 langs. New sections rendered: certificates, hobbies, STAR achievement.
- `components/CVPreview.tsx` — added Nationality, Hobbies, Certificates, STAR Achievement sections. RTL check now includes `ur`. Languages row shows proficiency.
- `components/LanguageToggle.tsx` — converted from 2-state toggle to **dropdown menu** showing all 4 languages with check mark on current.
- `app/(auth)/onboarding/page.tsx` — now a **2×2 grid of 4 cards** instead of 2 cards.
- `app/(dashboard)/record/page.tsx` — language picker shows 4 cards; uses LANGUAGES from i18n.
- `app/layout.tsx` — loads `Noto Nastaliq Urdu` + `Noto Sans Devanagari` Google Fonts.
- `app/globals.css` — `html[lang="ar|ur|hi"]` selectors swap the body font-family appropriately.
- `tailwind.config.ts` — added `font-urdu` and `font-devanagari` family tokens.

### DB migration Sumair needs to run
- Open Supabase SQL Editor → paste `supabase/migrations/002_questions_v2.sql` → Run.
- Verifies: `select count(*) from questions;` should return **36**.
- Old 5-question rows are deleted by the migration (no production CV data lost — only the questions table is touched).

### Validation
- `tsc --noEmit` clean.
- `next build` succeeds: 14 routes, build size grew ~30KB (extra fonts).

## 2026-06-03 — Day 3 (later): Country field + social links

### City + Country combined
- Added `country: string` to `CVPersonal`. Now displays as `City, Country` (single line, comma separator). If only one is provided, only that one shows; no stranded comma.
- Edit mode: two `<input>` fields side-by-side with a faint "," separator. Placeholder uses the new `edit.placeholder.city` and `edit.placeholder.country` i18n keys.
- Updated Q1 in all 3 languages (EN/AR/UR) to ask for both city AND country.
- `lib/claude.ts` prompt: country is now part of the personal block and explicitly noted as distinct from nationality.
- `migrateCvData` backfills empty `country` on any old CV.
- DB migration `004_q1_city_country.sql` rewrites Q1 in place (idempotent).

### Social links in Contact
- Added `socials: CVSocialLink[]` to `CVData` where each item is `{ url }`.
- Auto-detects platform from URL host: GitHub / LinkedIn / Twitter / Facebook / Instagram / YouTube / generic Website.
- Brand icons via `react-icons/fa` (lucide v1.x stripped branded icons — switched only the social platforms; rest of the app stays on lucide).
- Display: `[brand icon] [shortened host/path]` linking to the full URL.
- Edit: URL input + X to remove + "+ Add link" button at the bottom of the Contact section.
- PDF renders shortened URL text under Contact (no icons in PDF — keeps it simple and language-font safe).
- `migrateCvData` backfills empty `socials` array on any old CV.
- Claude prompt extended to capture URLs if the speaker mentions them, but does not invent ones.

### Files touched
- `types/cv.ts` — CVPersonal+country, new CVSocialLink, CVData+socials, migration backfill.
- `lib/i18n.ts` — added `cv.location`, `cv.socials`, `edit.add.social`, `edit.placeholder.city/country/socialUrl`.
- `lib/claude.ts` — JSON shape now includes country + socials.
- `lib/pdf-generator.tsx` — location combines city+country; socials list under Contact.
- `components/CVPreview.tsx` — detectPlatform()+shortDisplay() helpers; rewrote the location row and the Contact section.
- `supabase/migrations/004_q1_city_country.sql` (new) + `supabase/schema.sql` Q1 seeds updated.
- Installed `react-icons@^5`.

## 2026-06-03 (later still) — Security + readability pass

### 3-minute idle auto-logout
- New `hooks/useInactivityLogout.ts`. Sets a 3-minute timer; listens for mousemove / mousedown / keydown / scroll / touchstart / click events to reset it. On expiry → `supabase.auth.signOut()` → `router.push('/login')` → red toast "Signed out due to inactivity".
- Mounted in `app/(dashboard)/layout.tsx`. Active everywhere a session matters (`/dashboard`, `/record`, `/cv/*`, `/onboarding`); not active on landing / auth pages.
- Guarded with a `fired` ref so the logout call can't fire twice in a flap.
- Timer is cancelled on unmount; events are removed.

### Education + Certificates as bullet timeline
- Mirrored the existing experience timeline pattern. Both sections now have `border-s border-navy-100 ps-6` with `h-3 w-3 rounded-full border-2 border-teal bg-white` markers at each item.
- "+ Add" buttons aligned to `ps-6` so they sit under the column.
- PDF: each education + certificate row now starts with a teal `•` (`timelineDot` style) followed by the existing content on the right. Page layout unchanged; bullets sit in their own column.

### Combined City + Country edit field
- The previous design had two separate inputs separated by a literal comma. On any old CV where `country` was an empty migration-backfilled value, that empty box looked like an extra field.
- Now in edit mode the location shows ONE input pre-filled with `"City, Country"` (or just `"City"` or just `"Country"` if only one is set). On change we split on the first comma → `personal.city` + `personal.country`.
- Display mode unchanged — still uses `[city, country].filter(Boolean).join(", ")` so empty parts never render.

### Files touched
- `hooks/useInactivityLogout.ts` (new)
- `app/(dashboard)/layout.tsx`
- `components/CVPreview.tsx`
- `lib/pdf-generator.tsx`

## 2026-06-05 — Day 5: Multi-page PDF margins + template system

### PDF top + bottom margin on every page
- `lib/pdf-generator.tsx` `page` style now includes `paddingTop: 30` and `paddingBottom: 30`.
- Applies to every page including continuation pages, so multi-page CVs no longer have content flush against the top edge on page 2+.

### Template system foundation (in preparation for premium tier)
- New `TemplateId = "modern" | "minimalist" | "classic" | "executive"` type and `TEMPLATES` catalog with `premium: boolean` flag on each (Classic + Executive marked as premium "coming soon").
- `DEFAULT_TEMPLATE = "modern"`.
- `template` field added to `CVRecord` interface.
- DB migration `005_template_column.sql` adds a `template text not null default 'modern'` column to `cvs`. Existing rows backfilled.
- `migrateCvData` doesn't touch template — it lives on the row, not in `cv_data`.

### Minimalist template (first non-default option)
- Single-column layout, lots of whitespace, light typography.
- Header: centered name + horizontal contact line + thin bottom rule.
- Sections use small uppercase tracking-widest titles with `border-bottom border-navy-100` divider.
- Skills / Languages / Hobbies render as one comma-separated line for compactness.
- Experience uses the same bullet rendering as Modern.
- Achievement (STAR) inline rows.
- New `MinSection` helper at module level in `CVPreview.tsx` wraps the section title + content with the divider.
- Both display and edit modes work — uses the same `Editable` / `AddButton` / `RemoveButton` primitives so edits flow through the same `patch()` and debounced auto-save.

### Minimalist PDF document
- New `MinimalistDocument` in `lib/pdf-generator.tsx`. `CVDocument` now dispatches based on `template` prop.
- Generous 56pt left/right margins, 40pt top/bottom.
- Centered name + horizontal contact rule.
- Compact list rendering matches the preview (· separators).
- Bullets for experience and STAR letters preserved.

### TemplatePicker UI on CV view page
- New `components/TemplatePicker.tsx`. Renders one button per template; active button highlighted in teal; premium templates show a small amber crown/lock badge and are disabled.
- Mounted on `app/(dashboard)/cv/[id]/page.tsx` above the CVPreview. Saves `template` change to Supabase immediately (no debounce — template switch is intentional, not typing).
- The selection feeds both the preview (`CVPreview` receives `template` prop) and the PDF export (`/api/export-pdf` reads the saved `template` from the row).

### Files touched
- `types/cv.ts` — TemplateId, TEMPLATES, DEFAULT_TEMPLATE, CVRecord.template.
- `supabase/migrations/005_template_column.sql` (new) + `supabase/schema.sql`.
- `components/CVPreview.tsx` — `template` prop + Minimalist render branch + MinSection helper.
- `lib/pdf-generator.tsx` — `template` prop + dispatcher + MinimalistDocument + min styles + Page padding.
- `components/TemplatePicker.tsx` (new).
- `app/(dashboard)/cv/[id]/page.tsx` — TemplatePicker + changeTemplate handler.
- `app/api/export-pdf/route.ts` — reads template from row.

### What's not done yet
- Classic + Executive templates not built. Marked as premium "coming soon" in the picker so they're visible but disabled. Will build when Sumair confirms the architecture is right after seeing Minimalist live.
- No actual premium gating yet (just the visual badge). Real gating comes when Sumair sets up the paid tier.

## 🏷️ MILESTONE — v0.2.0-pdf-stable (commit 9f37281, 2026-06-04)
Sumair confirmed PDF download and the full English-only flow work end-to-end.
Tag on GitHub: https://github.com/sumair95/voicecv/releases/tag/v0.2.0-pdf-stable

Captures everything since v0.1.0:
- 3-min idle auto-logout, English-only CV output, hidden nationality
- City+country combined field, social links with brand icons
- Education + certs bullet timeline (preview + PDF)
- Refreshed Google Fonts URLs (v20/v33/v23) so PDF generation no longer 404s
- Hero refresh: sample CV cards, new trust badges, no hackathon mention
- Better error messaging for PDF download + Google OAuth

Roll back to this tag if any future change breaks PDF or English-only CV.

## 🏷️ MILESTONE — v0.1.0-editor-stable (commit bdaa5fa, 2026-06-03)
Sumair confirmed the editor is "perfect" and asked to lock the changes.
Tagged on GitHub: https://github.com/sumair95/voicecv/releases/tag/v0.1.0-editor-stable
Roll back to this tag if any future change regresses the editor.

## 2026-06-03 — Day 3: Skip questions + bullet experience + edit-mode banner

### Skip question
- `components/VoiceRecorder.tsx` accepts a new `onSkip?` prop. When in idle state, a small "Skip this question" link appears below the big record button.
- `app/(dashboard)/record/page.tsx` handles skip by recording an empty answer for that QA pair and advancing to the next question. Claude prompt already treats empty answers as "do not invent" so the corresponding CV section stays empty.
- Added i18n `rec.skip` (was already in place from Day 2) — wired now.

### Bullet point experience descriptions
- `lib/claude.ts`: updated system prompt — experience `description` must be newline-separated bullets, no markers; each starts with an action verb.
- `components/CVPreview.tsx`: new `BulletList` helper splits on `\n` (and strips any stray `-•*·–—` markers) and renders `<ul class="list-disc marker:text-teal">`.
- Display mode → bullets. Edit mode → keeps multiline contentEditable + adds an italic hint "Tip: put each bullet on its own line" so the user knows the editing convention.
- `lib/pdf-generator.tsx`: matching `bulletsFrom()` helper + `bulletRow / bulletDot / bulletText` styles render bullet rows in the PDF as well.

### Edit-mode banner
- Top of CV view in edit mode shows a teal info banner: *"Edit mode — click any field to change it, or use the + buttons to add more."*
- Reinforces that **existing content stays visible and editable** (it always was, but the visual signal was weak). Banner is `no-print` so it doesn't appear in the PDF.

### Editable rewrite — switch contentEditable → real `<input>`/`<textarea>`
- Symptom Sumair reported: when editing skills / languages / hobbies / contact / education / certificates, the existing value appeared to "hide", whereas work experience stayed visible.
- Root cause: the previous `Editable` rendered `<span contentEditable>` whose innerText was populated by `useEffect`. On mount or re-render, there was a brief moment the span was empty and the placeholder showed; for short chip-style fields this looked like content was being wiped. Also any layout reflow could make a 2-character min-width chip vanish.
- Fix: `Editable` now renders a real `<input>` (or `<textarea>` if `multiline`). The value is a controlled prop on the element, so the current text is *always* present in the DOM the moment the field renders — no timing race, no empty flash.
- Inherited typography via a small `.cv-input` utility (`font: inherit; color: inherit; text-align: inherit; direction: inherit;`) so the input still looks like the surrounding heading / paragraph.
- Visual affordance: dashed border in the current text colour by default; teal hover/focus highlight; solid teal border + ring + bolder font on focus.
- Side benefits:
  - Saves trigger on each keystroke (debounced 1s upstream), instead of only on blur.
  - RTL works for free because the input inherits `direction` from its container.
  - Native HTML `placeholder` attribute, no CSS pseudo-element trickery.
- Also stopped auto-removing skills/hobbies when the value goes empty mid-edit (otherwise the input would disappear while you're typing). Empty rows are filtered from the *display* view but kept for the editor; the X button is the only way to delete.

### Verified — every section preserves existing content in edit mode
- Personal info: editable in place.
- Contact (email, phone): editable in place; empty rows still visible.
- Objective: editable in place with new placeholder visible when empty.
- Experience / Education / Certificates: each item stays fully editable in place; "+ Add" button at section end.
- Skills / Languages / Hobbies: each chip/row stays editable inline; X button per item; "+ Add" button at end.
- Achievement (STAR): if present, all 4 fields editable; if missing, "+ Add" surfaces.

### Edit-mode visual affordance
- Problem: contact info + objective were already editable, but it looked like static text — no visual cue that you could click into them.
- Fix in `components/CVPreview.tsx` (`Editable` component) + `app/globals.css`:
  - In edit mode, every editable span gets a **dotted underline** in its own text color (visible on both navy sidebar and white main).
  - **Hover**: teal background tint + brighter underline.
  - **Focus**: stronger teal ring + bolder font weight + solid teal underline → the field being edited stands out.
  - **Teal text cursor** (`caret-color: #14B8A6`) so the blinking caret is obvious even on dark backgrounds.
  - **Empty placeholder** rendered via CSS `[contenteditable][data-placeholder]:empty::before` — so an empty Email field shows `email@example.com` faintly, an empty Objective shows `Objective…`, etc.
  - Print styles strip the underline / caret / bg so the printed CV stays clean.

### Bugfix — old CVs crashed the editor with "Application error"
- Symptom: opening a CV created before Day 2 threw a client-side runtime error.
- Cause: the v1 schema had no `certificates`, `hobbies`, or `achievement`, and `languages` was `string[]`. New CVPreview reads `data.certificates.length` etc., which crashes on `undefined`.
- Fix: added `migrateCvData(raw)` helper in `types/cv.ts` that backfills every missing field and converts `languages` from `string[]` → `{name, proficiency}[]`. Used at three load points:
  - `app/(dashboard)/cv/[id]/page.tsx` after the supabase fetch
  - `components/CVPreview.tsx` on mount + when `cvData` prop changes
  - `app/api/export-pdf/route.ts` before handing to `@react-pdf`
- Side effect: the next save (debounced auto-save when you edit a field) writes the migrated shape back to Supabase, so old CVs heal themselves over time.

### Full editor — every CV field is now editable
- Previously: text fields inside existing items were editable, but arrays couldn't grow/shrink and skills/languages/hobbies/achievement were display-only.
- Now (in `components/CVPreview.tsx`):
  - **Skills**: each chip is editable inline + has an X to remove; "+ Add skill" button at end. Clearing a chip auto-removes it.
  - **Languages**: name is editable + proficiency is a `<select>` with the 3 canonical levels (Beginner / Conversational / Fluent, localized). X to remove. "+ Add language" button.
  - **Hobbies**: same pattern as skills.
  - **Experience / Education / Certificates**: existing inline edits preserved; each item gets a hover-revealed X for delete; "+ Add" button at the end of each section.
  - **Achievement (STAR)**: if null, shows "+ Add achievement" → creates an empty STAR object. If present, the 4 fields are editable; X next to section title deletes the whole achievement.
- Reused the `Editable` contentEditable component; added two new tiny helpers `RemoveButton` and `AddButton` (dark + light variants for sidebar vs main).
- Localized add/remove copy in EN/AR/UR (`edit.add.*`, `edit.remove`, `edit.proficiency.*`, `edit.placeholder.*`).
- `lib/i18n.ts` extended with edit-action strings.

### Reversal — Hindi removed later same day
- Sumair clarified the original "3 languages" intent: keep **EN + AR + UR** only, drop Hindi.
- Reverted every `hi` touchpoint:
  - `types/cv.ts` Language now `"en" | "ar" | "ur"`.
  - `lib/i18n.ts` dropped all `hi` translations + LANGUAGES entry; `landing.subhead` mentions only 3 langs.
  - `app/layout.tsx` removed `Noto_Sans_Devanagari` import + variable.
  - `app/globals.css` dropped the `html[lang="hi"]` selector.
  - `tailwind.config.ts` dropped the `font-devanagari` family.
  - `lib/claude.ts` LANGUAGE_NAME map no longer includes `hi`.
  - `lib/pdf-generator.tsx` removed `NotoDevanagari` Font.register, `FONT_BY_LANG.hi`, `SECTION_LABELS.hi`.
- Wrote **`supabase/migrations/003_remove_hindi.sql`** — deletes `hi` rows from `questions` and resets any `hi` profile rows to `en`. Idempotent.
- `supabase/schema.sql` (fresh-project seed) trimmed back to 27 question rows (3 langs × 9 questions).
- `next build` still clean.
