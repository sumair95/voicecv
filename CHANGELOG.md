# Changelog

All notable changes to VoiceCV will be documented in this file.

## [Unreleased]

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
