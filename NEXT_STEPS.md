# Next Steps

## ✅ Done (Day 0 — 2026-05-30)
- Next.js 14 scaffold, deps, shadcn/ui, brand palette (navy + teal).
- Bilingual landing page with EN/AR + RTL flip, Navbar, LanguageProvider.
- Auth (email + Google OAuth) + onboarding + middleware.
- Dashboard with CV grid + empty state.
- VoiceRecorder (MediaRecorder + Web Audio waveform).
- /api/transcribe (Whisper), /api/generate-cv (Claude), /api/export-pdf (@react-pdf).
- Multi-step record flow with confetti, CVPreview, /cv/[id] view + inline edit.
- README, schema, .env.example, .gitignore.
- `next build` clean (14 routes).

## 🔑 Blocking on Sumair (browser steps — required to run the app end-to-end)
1. **Create Supabase project** at https://supabase.com/dashboard → New Project.
   - Copy `Project URL` (Settings → API → Project URL)
   - Copy `anon` public key
   - Copy `service_role` secret key (⚠ server-only)
2. **Run schema** — open Supabase SQL Editor → paste `supabase/schema.sql` → Run.
3. **OpenAI API key** — https://platform.openai.com → API keys → create new.
4. **Anthropic API key** — reuse from hisabbot/homebite, or https://console.anthropic.com.
5. **Paste all five into `.env.local`** (file is already in the repo root).
6. (For Google OAuth) In Supabase → Auth → Providers → enable Google, add a Google OAuth client and paste creds.

## 🚀 First run
```bash
cd voicecv
npm run dev
```
Open http://localhost:3001 (VoiceCV is pinned to 3001 so it doesn't collide with HomeBite on 3000)

## 🧪 Smoke test checklist
- Landing loads, EN↔AR toggle flips layout RTL.
- Sign up with email → lands on /onboarding → pick language → /dashboard.
- Click "Create New CV" → /record → confirm language → record q1..q5 → processing → confetti → /cv/[id].
- Edit a field on CV view, switch off edit mode, refresh — change persists.
- Click "Download PDF" → file downloads, opens in PDF viewer.
- Mobile (responsive view): record button is reachable, waveform animates.

## 📦 Coming next (after smoke test passes)
- Polish: micro-animations on hover, mobile sweep, longer recording compression.
- Demo prep (Day 7): 3-min walkthrough video, impact statement for judges, final README with live URL.
- Deploy: push to GitHub → Railway → add env vars → set `NEXT_PUBLIC_APP_URL` + Supabase allowed redirect URLs.
