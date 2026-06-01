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
