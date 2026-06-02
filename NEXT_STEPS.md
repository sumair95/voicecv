# Next Steps

> **For future sessions:** read this file + `WORKLOG.md` first to pick up exactly where we left off. `.env.local` holds real keys and is gitignored — values still live on Sumair's machine.

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

### Day 2 — 2026-06-02 (question set v2 + 4 languages)
- Languages expanded EN+AR → **EN+AR+UR+HI**. Urdu joins RTL.
- Recording flow 5 → **9 questions**. New section keys: recent_job, previous_roles, spoken_languages, certificates, hobbies, achievement.
- CV data model + preview + PDF updated to render Nationality, Certificates, Hobbies, STAR achievement.
- LanguageToggle is now a dropdown; onboarding + record picker show 4 language cards.
- DB migration written: `supabase/migrations/002_questions_v2.sql`.

## 🟡 In progress (Sumair, browser)

### Step 1 — Supabase schema (one-time)
- Open https://supabase.com/dashboard → project `ilksvltqcmcsjeappepq`.
- SQL Editor → paste `supabase/schema.sql` → Run.
- Confirms 3 tables exist (profiles, cvs, questions) + RLS policies + `recordings` storage bucket + auto-profile trigger.

### Step 1b — Apply question-set v2 migration (REQUIRED if schema.sql was already run before 2026-06-02)
- SQL Editor → paste `supabase/migrations/002_questions_v2.sql` → Run.
- Verify: `select count(*) from questions;` → should return **36**.
- Old 5-question set is replaced with new 9-question × 4-language set (36 rows total).

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
