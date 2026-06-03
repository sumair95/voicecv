# VoiceCV — Worklog

Chronological build log for the Kanz AI Hackathon (July 13–20, 2026).

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
