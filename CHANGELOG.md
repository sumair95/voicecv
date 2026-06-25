# Changelog

All notable changes to VoiceCV will be documented in this file.

## [Unreleased]
- **Italian (it) language support — 4th language.** Full UI translation (138 i18n keys), language picker entry, Italian recording questions (migration `007`), Whisper `it` transcription, Italian TTS voice (`it-IT`), and — crucially for an Italian job platform — **Italian CV output** (content + section headings) when the user records in Italian. EN/AR/UR still output English (Gulf decision preserved). New `cvs.language` column (migration `008`) persists each CV's output language for preview + PDF. ⚠️ Requires migrations `007` + `008` applied BEFORE deploy.
- **Sample CV gallery (`/samples`):** public page showing two realistic, on-audience sample CVs (a construction worker in Modern, a housekeeping supervisor in Minimalist) rendered with the real `CVPreview` — true WYSIWYG. Premium styles (Classic, Executive) shown honestly as locked "Coming soon" cards rather than faked. Linked from the hero sample-cards and the "See Demo" CTA.
- **Demo video section:** new gated `VideoDemo` landing component — click-to-load (no iframe until play, so zero landing cost). Hidden until a YouTube/Vimeo embed URL is set in the component; host off-app to avoid bandwidth.
- **TTS graceful fallback:** the "Listen" button now only appears when the device actually has a voice for the active language (re-checks on `voiceschanged`). Windows/Chrome usually lack AR/UR voices, so the button no longer appears dead. Proper fix (pre-generated audio) still pending.
- **Design/UX polish pass (pre-recruiter demo):**
  - **"Listen to the question" (TTS):** speaker button on each recording question reads it aloud in EN/AR/UR via browser `SpeechSynthesis` (free, no API key) — directly serves the literacy-barrier mission. Stops on question change/unmount.
  - **Honest stats:** landing stats fixed — "2 Languages" → "3", removed fabricated "10,000+ CVs"; now 5 min / 3 languages / 0 typing / 100% free.
  - **Urdu persistence bug fix:** `LanguageProvider` was dropping `ur` from localStorage on reload (only restored `ar`/`en`); now restores all three.
  - **Polish:** 3-col language pickers (no empty 4th cell), real `ArrowRight` CTA icon (RTL-aware) instead of a literal arrow char, gradient-mesh on auth pages, localized footer copyright, "Sample stories" label on testimonials, warmer recorder idle hint.
  - Checkpoint tag `v0.3.1-pre-design-audit` created for instant revert.
- **Download CV from dashboard:** download (PDF) button next to the delete button on each ready card — exports straight from the dashboard via `/api/export-pdf` without opening the CV first. Per-card spinner, success/error toast, localized EN/AR/UR. Hidden for CVs still processing (no `cv_data`).
- **Delete CV:** dashboard cards now have a trash button with an inline "Delete this CV?" confirm step (no accidental deletes), optimistic removal with exit animation, and a success/error toast. Localized EN/AR/UR. Deletes the `cvs` row via the existing `own cvs` RLS policy (`for all` already covers DELETE — no migration needed); no orphaned storage since recordings are never persisted. Reduces DB clutter.
- **Deploy fix:** `start` script no longer hardcodes `-p 3001` so Railway binds to its injected `$PORT`.

## [v0.2.0-pdf-stable] — 2026-06-04
Second stable milestone. PDF works end-to-end after multiple fixes; English-only CV output is the new default. Confirmed by Sumair.
Tag: https://github.com/sumair95/voicecv/releases/tag/v0.2.0-pdf-stable

Highlights:
- **Security:** 3-minute idle auto-logout on authenticated pages.
- **English-only CV:** Whisper still transcribes in the speaker's language; Claude translates and writes the CV (and PDF + preview) in English regardless of input language. UI menus continue in the user's chosen language.
- **CV content:** city+country combined edit, nationality hidden, social links with brand icons, education + certs in bullet timeline like work experience, no white bleed-through on the navy sidebar.
- **Hero refresh:** sample CV decoration cards, new trust badges ("Speak your future" / "Built without barriers"), no "Kanz AI Hackathon" wording.
- **PDF works:** refreshed Google Fonts URLs to current v20/v33/v23; dropped italic on objective (Inter italic wasn't registered); better error messaging for both PDF and Google OAuth.

## [v0.1.0-editor-stable] — 2026-06-03
First stable milestone of the CV editor. Confirmed working end-to-end by Sumair.
Tag: https://github.com/sumair95/voicecv/releases/tag/v0.1.0-editor-stable

Highlights:
- Voice flow: 9 questions × 3 languages (EN/AR/UR) with skip per question.
- AI: Whisper-1 transcribe + Claude Sonnet 4.6 CV generation.
- Editor: full inline add / edit / remove on every CV section (contact, objective, experience, education, certificates, skills, languages, hobbies, STAR achievement).
- Bullet-point work experience in preview + PDF.
- v1 CVs auto-migrate to v2 schema on load.
- Edit affordance: dashed teal border + teal caret + hover/focus highlights, no white bleed-through on the navy sidebar.

## [Unreleased]

### Added
- 2026-06-05: PDF pages now have a 30pt top + bottom padding, so multi-page CVs have proper breathing room on continuation pages.
- 2026-06-05: Template system foundation — `TemplateId` type, `TEMPLATES` catalog with premium flag, `template` column on `cvs` (migration 005), `TemplatePicker` UI on the CV view page.
- 2026-06-05: **Minimalist template** — single-column, clean typography, both preview + PDF. Selectable from the picker; saved per-CV.
- 2026-06-05: Classic + Executive templates listed in the picker as **Premium — coming soon** placeholders, in preparation for paid tier.
- 2026-06-03: `country` field on `CVPersonal`. The CV header shows `City, Country` on one line; if only one is provided, only that one renders.
- 2026-06-03: Social links on Contact — array of `{ url }` with auto-detected brand icons (GitHub, LinkedIn, Twitter, Facebook, Instagram, YouTube, generic Website). Add/edit/remove like other arrays.
- 2026-06-03: DB migration `004_q1_city_country.sql` updates Q1 in EN/AR/UR to ask for both city and country.
- 2026-06-03: `react-icons` dependency for brand icons (lucide v1.x dropped branded icons).
- 2026-06-03: Claude prompt extended to extract `country` and `socials` from the user's answer when mentioned.
- 2026-06-03: **Security** — 3-minute idle auto-logout on all authenticated pages (dashboard / record / cv view). `hooks/useInactivityLogout.ts` listens for activity events; on expiry signs the user out and redirects to /login with a toast.
- 2026-06-03: Education + Certificates rendered with the same teal timeline bullet style as Work Experience, in both the preview and the PDF.
- 2026-06-03: Combined the "City" and "Country" edit fields into one input in edit mode. Splits on the first comma. Removes the extra-empty-Country box that appeared on older CVs.

### Added
- 2026-05-30: Initial Next.js 14 scaffold with TypeScript, Tailwind, App Router.
- 2026-05-30: shadcn/ui base components installed.
- 2026-05-30: Supabase schema (profiles, cvs, questions, RLS, recordings bucket).
- 2026-05-30: Project directory structure for auth, dashboard, api, components.
- 2026-05-30: Bilingual landing page (EN/AR with RTL flip), Navbar, LanguageProvider, LanguageToggle.
- 2026-05-30: Auth flow — login, signup, Google OAuth callback, language onboarding, protected-route middleware.
- 2026-05-30: Dashboard with empty state and CV cards.
- 2026-05-30: VoiceRecorder component (MediaRecorder + Web Audio waveform, 2-min cap).
- 2026-05-30: /api/transcribe (Whisper-1), /api/generate-cv (Claude sonnet 4.6), /api/export-pdf (@react-pdf).
- 2026-05-30: Multi-step record flow with animated processing screen + confetti.
- 2026-05-30: CVPreview (2-column print-ready, inline edit, RTL-aware) + CV view/edit page with debounced auto-save.
- 2026-05-30: README, .env.example, tightened .gitignore.
- 2026-06-01: Dev/start port pinned to 3001 (was 3000) so VoiceCV runs alongside HomeBite.
- 2026-06-01: `NEXT_PUBLIC_APP_URL` updated to `http://localhost:3001` across env files + docs.
- 2026-06-01: Initialized own git repo in `voicecv/`, pushed to private GitHub repo `sumair95/voicecv` on branch `main`.
- 2026-06-01: Replaced "Powered by Claude AI" badge with "Developed by DevVibe AI" (EN + AR).
- 2026-06-02: Expanded supported languages from 2 (EN/AR) → 4 (EN/AR/UR/HI). Urdu joins RTL handling.
- 2026-06-02: Recording flow expanded from 5 → 9 questions. New field_keys: recent_job, previous_roles, spoken_languages, certificates, hobbies, achievement.
- 2026-06-02: CVData now carries nationality, certificates[], hobbies[], languages with proficiency, optional STAR achievement.
- 2026-06-02: CV preview + PDF render new sections (Certificates, Hobbies, Key Achievement). PDF fonts include Noto Nastaliq Urdu + Noto Sans Devanagari.
- 2026-06-02: LanguageToggle changed from 2-state toggle to 4-language dropdown.
- 2026-06-02: Onboarding + record language picker show 4 cards instead of 2.
- 2026-06-02: Added DB migration `supabase/migrations/002_questions_v2.sql` (36 question rows).
- 2026-06-02: Removed Hindi support — supported languages now EN + AR + UR only. Added migration `003_remove_hindi.sql` to drop `hi` rows from existing DBs. Noto Sans Devanagari font no longer loaded.
- 2026-06-02: Full CV editor — every section now supports add / remove / inline edit, including skills, languages (name + proficiency select), hobbies, certificates, work experience, education, and the optional STAR achievement.
- 2026-06-02: Bugfix — opening a CV created under the v1 schema crashed with "Application error" because new fields (certificates, hobbies, achievement) were `undefined` and `languages` was `string[]`. Added `migrateCvData()` to backfill + convert at every load site (CV view page, CVPreview, /api/export-pdf). Old CVs heal on first save.
- 2026-06-02: Edit mode visual affordance — every editable field now has a dotted underline + teal text-cursor + hover/focus highlight + empty-state placeholder. Contact info and Objective look obviously editable now.
- 2026-06-03: Skip-this-question link below the record button on every question. Skipping records an empty answer and Claude leaves the corresponding section blank.
- 2026-06-03: Work experience descriptions render as bullet points in both the CV preview and the PDF. Claude is prompted to return one bullet per line. Edit mode shows a "one bullet per line" tip.
- 2026-06-03: Edit-mode banner at the top of the CV view explains the editor (click to edit, + to add more). All sections continue to show existing content in edit mode.
- 2026-06-03: Editable internals switched from `contentEditable` `<span>` to native `<input>` / `<textarea>`. Fixes a long-standing perception that existing content disappeared when entering edit mode (the span needed a useEffect to inject innerText; for chip-style fields the brief empty moment was visible). Inputs inherit surrounding typography via a `.cv-input` utility class.
- 2026-06-03: Fixed white-box rendering on the navy sidebar in edit mode. Inputs now force `background-color: transparent` and the dashed border uses an explicit teal tint (instead of `currentColor`) so it reads cleanly on both the dark sidebar and light main column.
