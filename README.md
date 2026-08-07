# VoiceCV — Speak. We Write. You Succeed.

Bilingual (Arabic/English) AI CV generator. Turn a 5-minute voice recording into a professional, downloadable CV — free.

Built for the **Kanz AI Hackathon (July 13–20, 2026)**.

## Problem
Millions of workers in Saudi Arabia and the Gulf cannot write a professional CV. Language barriers, lack of formal education, and limited digital literacy prevent them from accessing better jobs — even when they have the skills and experience.

## Solution
VoiceCV lets anyone create a professional CV by answering 5 simple voice questions in Arabic or English. AI transcribes their speech, understands their experience, and generates a formatted, downloadable CV in under 60 seconds.

## Impact
- No literacy required — voice-first interface
- Free, fully online, mobile-compatible
- Supports Arabic (RTL) and English
- Directly enables Saudi Vision 2030 Saudization goals
- Built for integration with platforms like Kanz

## Tech Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, framer-motion
- **Auth + DB:** Supabase (Auth, PostgreSQL, Storage)
- **Speech-to-text:** OpenAI Whisper (`whisper-1`)
- **CV generation:** Anthropic Claude (`claude-sonnet-4-6`)
- **PDF export:** `@react-pdf/renderer`
- **Deployment:** Railway

## Architecture (text)

```
Browser
  │   (MediaRecorder, Web Audio AnalyserNode)
  ▼
Next.js App Router
  ├── /                landing
  ├── /signup, /login, /onboarding
  ├── /dashboard       list user's CVs (Supabase)
  ├── /record          5-question voice flow
  ├── /cv/[id]         live preview + inline edit
  └── /api
       ├── /transcribe    Whisper → text
       ├── /generate-cv   Claude → structured JSON
       └── /export-pdf    @react-pdf → A4 PDF
            │
            ▼
       Supabase (RLS: own profile, own cvs)
       └── tables: profiles, cvs, questions
       └── bucket: recordings
```

## Setup

### 1. Clone + install
```bash
git clone <repo>
cd voicecv
npm install
```

### 2. Supabase
1. Create a project at https://supabase.com/dashboard
2. Open **SQL Editor** → paste `supabase/schema.sql` → Run
3. **Settings → API** → copy `Project URL`, `anon`, and `service_role` keys

### 3. Environment
Copy `.env.example` to `.env.local` and fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...        # https://console.anthropic.com
OPENAI_API_KEY=...           # https://platform.openai.com (Whisper)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 4. Run
```bash
npm run dev
```
Open http://localhost:3001
(Port 3001 chosen so VoiceCV runs alongside HomeBite on port 3000.)

## API Documentation

### `POST /api/transcribe`
Transcribe audio to text via Whisper.

- **Body:** `multipart/form-data`
  - `audio`: `Blob` (WebM / Opus)
  - `language`: `"en" | "ar"`
- **Auth:** required (Supabase session cookie)
- **Returns:** `{ transcript: string }`

### `POST /api/generate-cv`
Generate a structured CV from Q&A pairs.

- **Body:** JSON
  - `qaPairs`: `[{ question, answer, field_key }]`
  - `language`: `"en" | "ar"`
  - `cvId?`: existing CV row to update
- **Returns:** `{ cvId, cvData }`

### `POST /api/export-pdf`
Render the saved CV to a downloadable PDF.

- **Body:** `{ cvId: string }`
- **Returns:** `application/pdf` (attachment)

## Deployment (Railway)

1. Push to GitHub.
2. Railway → New Project → Deploy from GitHub.
3. Add all env vars from `.env.local` to Railway → Variables.
4. Set `NEXT_PUBLIC_APP_URL` to the Railway-generated URL.
5. In **Supabase → Auth → URL Configuration**, add the Railway URL to the allowed redirect URLs.

### Deployment target is not interchangeable

VoiceCV must run on a **long-lived Node process** (Railway, Render, Fly, a
container — not Vercel/Lambda/Cloud Run).

`POST /api/generate-cv` returns the CV as soon as the primary model is done and
finishes two jobs *after* responding: seeding the reusable profile, and running
the multi-model competition that may swap in a better CV. On a serverless
platform the process is frozen once the response flushes, so both are dropped —
and dropped silently, which is the dangerous part: the competition simply never
runs and nothing reports it.

If you must move to serverless, upgrade to Next 15 and wrap those calls in
`after()`, or move them to a real job queue. `lib/runtime/background.ts` detects
the common serverless platforms and logs an error naming the job it is about to
drop, so a wrong target shows up in the logs instead of as missing features.

## Team
- **Sumair Shahid** — Backend, AI integration, deployment
- Partner — Frontend, UI/UX, Arabic localization

## License
MIT
