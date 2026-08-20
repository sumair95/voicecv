# Next Steps

> **For future sessions:** read this file + `WORKLOG.md` first to pick up exactly where we left off. `.env.local` holds real keys and is gitignored — values still live on Sumair's machine.

## 🏷️ Stable checkpoints to roll back to
**`v0.2.0-pdf-stable`** (commit `9f37281`, 2026-06-04) — current latest
- PDF download works; CV always rendered in English; idle auto-logout; refreshed Google Fonts.
- `git checkout v0.2.0-pdf-stable` to return here exactly.

**`v0.1.0-editor-stable`** (commit `bdaa5fa`, 2026-06-03) — previous milestone
- First fully-editable CV preview.
- `git checkout v0.1.0-editor-stable` if you need to roll back further.

## ✅ Done so far

### Day 0 — 2026-05-30 (code scaffold)
- Next.js 14 scaffold, deps, shadcn/ui, brand palette (navy + teal).
- Bilingual landing page with EN/AR + RTL flip, Navbar, LanguageProvider.
- Auth (email + Google OAuth) + onboarding + protected-route middleware.
- Dashboard with CV grid + empty state.
- VoiceRecorder (MediaRecorder + Web Audio waveform).
- /api/transcribe (Whisper), /api/generate-cv (Claude), /api/export-pdf (@react-pdf).
- Multi-step record flow with confetti, CVPreview, /cv/[id] view + inline edit.
- README, schema, .env.example, .gitignore.
- `next build` clean (14 routes).

### Day 1 — 2026-06-01 (env + GitHub + port)
- Real API keys pasted into `.env.local` by Sumair (Supabase + Anthropic + OpenAI).
- Port pinned to **3001** for local dev (HomeBite owns 3000).
- `npm run dev` confirmed working at http://localhost:3001.
- Code pushed to private repo: **https://github.com/sumair95/voicecv** (branch `main`).

### Day 2 — 2026-06-02 (question set v2 + 3 languages)
- Recording flow 5 → **9 questions**. New section keys: recent_job, previous_roles, spoken_languages, certificates, hobbies, achievement.
- Languages settled at **EN + AR + UR** (Hindi was added then removed same day per Sumair's clarification).
- CV data model + preview + PDF updated to render Nationality, Certificates, Hobbies, STAR achievement.
- LanguageToggle is now a dropdown; onboarding + record picker show 3 language cards.
- DB migrations written: `002_questions_v2.sql` (9q × 4 lang) then `003_remove_hindi.sql` (drop `hi` → 9q × 3 lang).

## 🟡 In progress (Sumair, browser)

### ⚡ Step 0 — JD Match: run migration 028, then smoke-test (added 2026-08-20)

The `/jobs/match` feature is code-complete and `npm run build` is clean, but the
table it writes to does not exist yet.

1. **Supabase → SQL Editor → paste `supabase/migrations/028_jd_match.sql` → Run.**
   Creates `jd_matches` + owner-only RLS + the column grants that keep the paid
   `draft` column unreadable from the browser.
2. **Verify the paywall actually holds.** In the browser console while logged in:
   ```js
   await supabase.from('jd_matches').select('draft')   // must fail: permission denied
   await supabase.from('jd_matches').select('id, overall_score')  // must succeed
   ```
3. **Smoke test the flow** at `/jobs/match`: pick a CV → paste a real job ad →
   *Check My Match* (~40s, Opus) → confirm the score, the breakdown bars and the
   missing keywords render → click *Unlock* → confirm a **new** CV appears in the
   dashboard (master CV unchanged), titled `<CV> — <Role> @ <Company>`, with
   premium templates unlocked and one premium-CV credit spent.
4. **Also test a PDF upload** (any job ad PDF) via the *Upload PDF* button — it
   goes through Claude's document input, no parsing library involved.

Until step 1 is done the analysis still works (score + gaps render), but the
unlock card is hidden on purpose — the route degrades rather than 500-ing after
a paid model call. Cost note: each analysis is one `claude-opus-5` call at
~2.3k in / 2.2k out with adaptive thinking. If that proves too expensive at
volume, set `CLAUDE_MATCH_MODEL=claude-sonnet-4-6` in Railway — no redeploy of
code needed.

### ⚡ Step 0b — Editor fixes (added 2026-08-20). No migration needed.

Three changes that need nothing but a deploy. Worth eyeballing once live:

1. **Skill "×" now works.** It was never a broken handler — the input was always
   ~221px wide regardless of content, so chips overflowed the Modern sidebar and
   the × landed underneath `<main>`, which ate the click. Check: edit a CV, click
   the × on a skill in all four templates. Note every field is now sized to its
   content, so edit mode looks tighter than before — that's intended.
2. **Experience ↑/↓ + "Newest first".** Edit a CV with 2+ jobs: arrows on each
   entry, and a "Newest first" toolbar button that greys out when already
   sorted. Jobs whose dates we can't parse deliberately stay put.
3. **"Upload a CV" on the dashboard.** Try a real PDF CV. It should land in the
   editor with jobs in order and dates verbatim. It costs one CV from the free
   allowance, so an over-limit account gets the upsell instead.

### Step 1 — Supabase schema (one-time)
- Open https://supabase.com/dashboard → project `ilksvltqcmcsjeappepq`.
- SQL Editor → paste `supabase/schema.sql` → Run.
- Confirms 3 tables exist (profiles, cvs, questions) + RLS policies + `recordings` storage bucket + auto-profile trigger.

### Step 1b — Apply question-set v2 migration (REQUIRED if schema.sql was already run before 2026-06-02)
- SQL Editor → paste `supabase/migrations/002_questions_v2.sql` → Run.
- This seeds 36 rows (9 questions × 4 languages including Hindi).

### Step 1c — Apply Hindi-removal migration (REQUIRED after running 002)
- SQL Editor → paste `supabase/migrations/003_remove_hindi.sql` → Run.
- Verify: the verification query at the bottom returns `ar=9, en=9, ur=9` (27 rows total).
- Hindi rows are dropped; any user profile that was on `hi` is reset to `en`.

### Step 1d — Apply Q1 city+country update (REQUIRED for new CVs to ask about country)
- SQL Editor → paste `supabase/migrations/004_q1_city_country.sql` → Run.
- Q1 in EN/AR/UR now asks for "city AND country" instead of just "city".
- Existing CVs are unaffected; their `country` field is backfilled to empty on load.

### Step 1e — Apply template column migration (REQUIRED for the new template picker)
- SQL Editor → paste `supabase/migrations/005_template_column.sql` → Run.
- Adds a `template text not null default 'modern'` column to `cvs`. Existing rows get backfilled.
- Verify: `select template, count(*) from cvs group by template;` should show all rows as `modern`.

### Step 2 — Supabase Auth URL config (so login redirects work)
- Authentication → URL Configuration:
  - **Site URL:** `http://localhost:3001`
  - **Redirect URLs (add):**
    - `http://localhost:3001/auth/callback`
    - (After Railway): `https://<your-railway-domain>/auth/callback`
- (Optional, dev convenience) Authentication → Providers → Email → toggle off "Confirm email".

### Step 3 — Railway deploy
Detailed steps recorded in the chat; condensed here:
1. https://railway.app/dashboard → New Project → Deploy from GitHub repo → **sumair95/voicecv**.
2. First build will fail (no env vars yet) — that's expected.
3. Service → Variables → Raw Editor → paste all 6 from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL=<set after step 4>`
4. Settings → Networking → **Generate Domain** → copy the URL.
5. Update `NEXT_PUBLIC_APP_URL` to the Railway URL (with `https://`).
6. Add the Railway URL to Supabase Site URL + Redirect URLs (step 2 above).
7. If Railway start fails on port: change `package.json` `"start": "next start"` (drop `-p 3001`) and push.

## 🧪 Smoke test checklist (after Railway is live)
- Landing loads, EN↔AR toggle flips layout RTL.
- Sign up with email → lands on `/onboarding` → pick language → `/dashboard`.
- Click "Create New CV" → `/record` → confirm language → record q1..q5 → processing → confetti → `/cv/[id]`.
- Edit a field on CV view, switch off edit mode, refresh — change persists.
- Click "Download PDF" → file downloads + opens correctly.
- Mobile (real phone, not just devtools): record button reachable, mic permission prompts, waveform animates.

## 📦 Backlog (post smoke-test)
- **Polish:** micro-animations on hover, mobile sweep, audio compression for slow networks.
- **Performance:** lazy-load the PDF renderer (heavy bundle).
- **Robustness:** offline recording fallback (localStorage queue → sync on reconnect), retry UI on Whisper/Claude failures, server-side validation of CVData shape from Claude.
- **Audit log:** save Whisper transcripts + Claude prompt/response to a `cv_events` table for debugging.
- **Demo prep (week of July 13):** 3-min walkthrough video, impact statement for judges, final README with live Railway URL.

## 🔁 If you lose this session — how to resume
1. `cd "C:\Users\admin\AI Agent\voicecv"`
2. Read **WORKLOG.md** (chronology) and **NEXT_STEPS.md** (this file).
3. Confirm `.env.local` still has all 6 keys.
4. `npm run dev` → http://localhost:3001 should serve the landing page.
5. `git status` should be clean; `git log --oneline` shows the commit history.
6. GitHub: https://github.com/sumair95/voicecv
7. Next concrete action is whichever step above is not yet ticked.
