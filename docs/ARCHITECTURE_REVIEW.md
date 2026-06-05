# VoiceCV — Senior Engineer Architecture Review

> Snapshot of the codebase at commit `c8ba0aa` (2026-06-05). Generated as part of a code-quality pass before scaling to a paid tier. **Functionality preserved everywhere — recommendations are quality, scalability, and maintainability only.**

---

## 1. Architecture map (reverse-engineered)

### Layers

```
┌──────────────────────────────────────────────────────────────┐
│  Client (Next.js App Router, all "use client" pages)         │
│  ├─ Landing               app/page.tsx                       │
│  ├─ Auth                  app/(auth)/{login,signup,onboarding}│
│  ├─ Recorder + flow       app/(dashboard)/record + Voice…    │
│  ├─ Dashboard list        app/(dashboard)/dashboard          │
│  └─ CV view/edit          app/(dashboard)/cv/[id]            │
│        └─ CVPreview ←—— dispatcher: Modern | Minimalist      │
│        └─ TemplatePicker                                     │
└──────────────────────────────────────────────────────────────┘
                │ supabase-js (browser, cookies)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Edge: middleware.ts refreshes Supabase session + gates      │
│  protected routes (/dashboard /record /cv /onboarding)       │
└──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Server (Next.js Route Handlers, Node runtime)               │
│  ├─ POST /api/transcribe      Whisper-1 (Blob → text)        │
│  ├─ POST /api/generate-cv     Claude → CVData JSON           │
│  ├─ POST /api/export-pdf      @react-pdf → application/pdf   │
│  └─ GET  /auth/callback       Supabase OAuth exchange        │
└──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────┐
│  External services                                           │
│  ├─ Supabase  Postgres + Auth + Storage                      │
│  ├─ OpenAI    Whisper-1 STT                                  │
│  ├─ Anthropic claude-sonnet-4-6                              │
│  └─ Google Fonts (gstatic) → font fetch at PDF render        │
└──────────────────────────────────────────────────────────────┘
```

### End-to-end data flow (the only path that exists today)

1. User picks language → `app/(dashboard)/record` fetches `questions` from Supabase for that language.
2. For each of 9 questions: `<VoiceRecorder>` records → POSTs to `/api/transcribe` → returns text.
3. All 9 `QAPair`s POST to `/api/generate-cv`:
   - Inserts a `cvs` row with `status='processing'`, `transcript`.
   - Calls `lib/claude.generateCV(qa, lang)` → JSON.
   - Updates the row with `cv_data`, `title`, `status='ready'`.
4. Redirect to `/cv/[id]`:
   - Re-fetches the row, runs `migrateCvData()` to backfill schema gaps.
   - Renders `<CVPreview template={cv.template} editable={editing}>`.
   - Edits go through a shared `patch()` → debounced 1s `cvs.update()`.
   - "Download PDF" POSTs to `/api/export-pdf` which re-fetches the row, runs `migrateCvData()` again, and renders via `<CVDocument template={…}>` → `renderToBuffer`.

### Module-size signal (lines of code)

| File                                 | LoC  | Smell |
|--------------------------------------|------|---|
| `components/CVPreview.tsx`           | 1618 | ⚠️ god-component |
| `lib/pdf-generator.tsx`              | 931  | ⚠️ god-module |
| `lib/i18n.ts`                        | 425  | ⚠️ single-dict bag |
| `components/VoiceRecorder.tsx`       | 300  | ✅ self-contained |
| `app/(dashboard)/record/page.tsx`    | 299  | ⚠️ flow + 4-stage UI in one component |
| `app/page.tsx`                       | 262  | ✅ landing, fine |
| `types/cv.ts`                        | 211  | ⚠️ types + constants + migration logic mixed |
| `app/(dashboard)/cv/[id]/page.tsx`   | 203  | ✅ but has duplicated supabase calls |

---

## 2. Critical problem areas

### 🔴 P0 — Correctness / data integrity risks

| # | Issue | Location | Why it matters |
|---|---|---|---|
| 1 | `/api/generate-cv` writes a `status='processing'` row **before** calling Claude. If Claude/Supabase throws, the row stays in `processing` forever. | `app/api/generate-cv/route.ts:33–51` | Dashboard shows zombie rows; user thinks CV is still being generated. |
| 2 | Stale closure: `handleChange`'s `setTimeout` captures `cv?.title` at the moment of the keystroke, not at fire time. Rapid typing across name + objective can save a stale title. | `app/(dashboard)/cv/[id]/page.tsx:50–65` | Title regresses silently. |
| 3 | `migrateCvData()` runs at **three** layers (CV page, CVPreview, PDF route). If the function ever does something non-idempotent (validation rejection, normalization that drops fields), behavior diverges by call-site. | `types/cv.ts:159`, called 3× | Migration logic must be guarded; today it is, but the call-site sprawl is brittle. |
| 4 | Type assertion soup: `(cv as unknown as { template?: TemplateId }).template`. Supabase queries return `any` and are manually cast to `CVRecord`. | `app/api/export-pdf/route.ts:42`, `cv/[id]/page.tsx:38`, dashboard | One schema change → silent runtime breakage. |
| 5 | `record/page` `useEffect` lists `questions.length` as a dep. Triggers refetch loop if `setQuestions([])` ever runs at the wrong time. The current guard works, but the deps array is misleading. | `app/(dashboard)/record/page.tsx:39–50` | Subtle infinite loop risk on edits. |
| 6 | OAuth callback (`/auth/callback`) silently sends user to `/login?error=oauth` without surfacing the error. | `app/auth/callback/route.ts` | Users get bounced with no idea why. |

### 🟠 P1 — Scalability / performance

| # | Issue | Location | Impact |
|---|---|---|---|
| 7 | Dashboard `select("*").eq("user_id", user.id)` with **no pagination, no limit**. | `app/(dashboard)/dashboard/page.tsx:24–35` | Linear cost per render; user with 200 CVs gets a 500 KB JSON down the wire. |
| 8 | Supabase client instantiated on every callback (`handleChange`, `changeTemplate`, `downloadPdf`). | `app/(dashboard)/cv/[id]/page.tsx` (4 instances) | Cold cost is small but unnecessary; should be memoized once per component. |
| 9 | Inline arrow handlers inside `data.skills.map(...)` etc. produce a fresh closure on every render of the whole CV. | `components/CVPreview.tsx` ~60 places | Re-renders the entire CV (1.6k lines of JSX) on every keystroke. Already noticeable in edit mode. |
| 10 | PDF generation fetches **3 fonts** from `fonts.gstatic.com` on every render. Cold serverless start = ~1s of network. URL hashes also rotate, causing 404s (already burned us once). | `lib/pdf-generator.tsx:6–60` | Hard outage risk; should bundle fonts locally. |
| 11 | `@react-pdf/renderer` is huge (~250 KB). Loaded into `/cv/[id]` client bundle even though it only runs server-side. | `lib/pdf-generator.tsx` re-exports `CVDocument` | Verify `next build` tree-shakes; if not, split into `lib/pdf/server.tsx`. |
| 12 | No DB indexes mentioned for `cvs.user_id`, `cvs.created_at` (used for `order`). Postgres will seq-scan. | `supabase/schema.sql` | At 10k+ rows, dashboard query gets slow. |
| 13 | No structured logging or error reporting (Sentry, etc.). `console.error(...)` 14 sites; no correlation IDs. | repo-wide | Can't debug production. |
| 14 | No retries on Whisper / Claude. Transient failures fail end-user. | `lib/whisper.ts`, `lib/claude.ts` | Visible flake rate to users. |

### 🟡 P2 — Maintainability / duplication

| # | Issue | Location | Impact |
|---|---|---|---|
| 15 | **CVPreview is a god-component** (1618 LoC). Modern + Minimalist layouts inlined with full duplicate JSX per section. Every new template will double the file. | `components/CVPreview.tsx` | Cannot scale to the planned 5 templates without serious harm. |
| 16 | **pdf-generator mirrors the duplication** — `ModernDocument` and `MinimalistDocument` re-render the same data 8 ways each. | `lib/pdf-generator.tsx` | Same scaling problem. |
| 17 | 60+ copies of the array-edit boilerplate: `(v) => { const next = [...data.skills]; next[i] = v; patch({ skills: next }); }` for every array field in every layout. | `CVPreview.tsx` | Touching the edit-save pipeline means touching 60+ sites. |
| 18 | `types/cv.ts` mixes **types + UI constants (TEMPLATES) + migration logic (migrateCvData) + defaults (EMPTY_CV)**. | `types/cv.ts` | "types" file is the only file allowed to grow, so everyone dumps stuff there. |
| 19 | `lib/i18n.ts` is one 425-line object holding all 130+ strings × 3 languages. Adding a 4th language doubles file width. | `lib/i18n.ts` | Translator hand-off is impossible. |
| 20 | Inline color literals (`#0F172A`, `#14B8A6`, `rgba(20,184,166,…)`) appear in **both** CVPreview and pdf-generator with no shared source of truth. | both | Re-brand requires editing in 6 places. |
| 21 | No tests anywhere. Not even a smoke test for the API routes. | repo-wide | Refactors carry full regression risk. |
| 22 | `record/page.tsx` is a 4-stage state machine implemented as `useState`. Each stage has its own JSX block + transitions. | `app/(dashboard)/record/page.tsx` | Adding a 5th stage means another flag. `useReducer` would shrink and clarify. |
| 23 | Premium gate (`TemplateInfo.premium`) is a flag with no backing entitlement check. Anyone editing local state can flip a row's template to premium. | `components/TemplatePicker.tsx`, `cv/[id]/page.tsx` | When you launch paid tier, this is a free-bypass bug. |

### 🔵 P3 — Security / hardening

| # | Issue | Location |
|---|---|---|
| 24 | No CSRF protection on POST routes (Supabase cookies + same-origin Fetch — currently safe by default but explicit checks would be safer). |
| 25 | `toast.error(error.message)` exposes raw Supabase / Anthropic error strings to users. |
| 26 | No rate limiting on `/api/transcribe` or `/api/generate-cv`. A logged-in user can burn $/CV by spamming. |
| 27 | No CSP, no `X-Frame-Options`, no `Referrer-Policy`. |
| 28 | `SUPABASE_SERVICE_ROLE_KEY` is registered but `createServiceClient()` is never used. Either remove it or fence its callers. |
| 29 | `record/page.tsx` POSTs the full transcript JSON without validating size. A 2 MB answer would balloon Claude tokens. |

### 🟣 P4 — Observability / ops

| # | Issue |
|---|---|
| 30 | No structured request IDs, no logging context. Bad PDF error message ≠ which user, which CV. |
| 31 | No funnel metrics (start record → finish record → CV generated → CV downloaded). Conversion is invisible. |
| 32 | No health endpoint, no Supabase status check. |
| 33 | Font URLs to `fonts.gstatic.com` rotate occasionally — already broke PDF once. No alerting. |
| 34 | `next build` warnings about Webpack cache size are ignored. |

---

## 3. Clean architecture breakdown (target state)

```
voicecv/
├── app/                                Next.js routing only — thin
│   ├── (auth)/                         Page shells
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── record/
│   │   └── cv/[id]/
│   └── api/                            HTTP boundary (validate → call domain)
│       ├── transcribe/route.ts
│       ├── generate-cv/route.ts
│       └── export-pdf/route.ts
│
├── components/
│   ├── ui/                             shadcn primitives (untouched)
│   ├── recorder/                       VoiceRecorder + sub-pieces
│   ├── cv/
│   │   ├── primitives/                 Editable, AddButton, RemoveButton,
│   │   │                               BulletList, StarRow, Section
│   │   ├── templates/
│   │   │   ├── ModernLayout.tsx        300 LoC each, not 1600
│   │   │   ├── MinimalistLayout.tsx
│   │   │   ├── ClassicLayout.tsx (TBD)
│   │   │   └── ExecutiveLayout.tsx (TBD)
│   │   ├── CVPreview.tsx               <100 LoC — dispatcher only
│   │   ├── TemplatePicker.tsx
│   │   └── hooks/
│   │       ├── usePatchableCV.ts       extracts the patch helpers
│   │       └── useDebouncedSave.ts
│   └── language/                       LanguageProvider + Toggle
│
├── lib/
│   ├── ai/
│   │   ├── claude.ts                   thin wrapper + prompt
│   │   ├── claude.prompt.ts            prompt as data, easy to A/B
│   │   ├── whisper.ts
│   │   └── retry.ts                    exponential backoff
│   ├── supabase/
│   │   ├── client.ts                   browser
│   │   ├── server.ts                   RSC + route handlers
│   │   ├── middleware.ts
│   │   ├── service.ts                  service-role (fenced)
│   │   └── types.gen.ts                supabase gen types --schema public
│   ├── cv/
│   │   ├── migrate.ts                  migrateCvData lives here, called once at API boundary
│   │   ├── empty.ts                    EMPTY_CV
│   │   └── helpers.ts                  bulletsFrom, shortDisplay, detectPlatform
│   ├── pdf/
│   │   ├── icons.tsx                   PDF SVG icon primitives
│   │   ├── theme.ts                    NAVY / TEAL / MUTED constants — shared
│   │   ├── components/                 SectionHeader, TimelineItem, ContactRow
│   │   ├── templates/
│   │   │   ├── modern.tsx
│   │   │   └── minimalist.tsx
│   │   ├── fonts.ts                    bundled font sources
│   │   └── render.ts                   dispatcher: renderCV(cv, template) → Buffer
│   ├── i18n/
│   │   ├── index.ts                    tr(key, lang, vars)
│   │   ├── en.ts                       split per language
│   │   ├── ar.ts
│   │   ├── ur.ts
│   │   └── types.ts                    Key union from `en` so missing keys fail typecheck
│   ├── api/
│   │   ├── respond.ts                  ok() / error() / problem() helpers
│   │   └── handle.ts                   try/catch wrapper with structured logging
│   ├── env.ts                          validated env once at boot (zod)
│   └── log.ts                          structured logger w/ request id
│
├── types/
│   └── cv.ts                           pure types only — no runtime, no constants
│
└── hooks/
    └── useInactivityLogout.ts
```

**Two laws of this layout:**

1. **`types/` has no runtime code.** Migration moves to `lib/cv/migrate.ts`. Constants move to `lib/cv/`. The `TemplateInfo` catalog moves next to `TemplatePicker.tsx`.
2. **God-components are split by responsibility, not by file size.** `CVPreview` becomes a 60-line dispatcher; each template owns its layout in its own file with shared primitives.

---

## 4. Refactoring strategy — prioritized, with risk

Each step is **independently shippable**, so v0.2.0-pdf-stable is never broken.

### Phase A — Foundation (low risk, do first)

| Step | Effort | Risk | Value |
|---|---|---|---|
| A1. `lib/env.ts` — zod-validated env, throw at boot | 30 min | Low | Catches missing keys immediately |
| A2. `lib/log.ts` — `logger.info/warn/error` with request ID + context | 30 min | Low | Foundation for everything |
| A3. `lib/api/respond.ts` + `handle.ts` — uniform try/catch wrapper | 30 min | Low | Cuts duplication in 3 routes |
| A4. Generate Supabase types (`supabase gen types`) → drop manual `as CVRecord` casts | 30 min | Low | Type safety, no behavior change |
| A5. Extract `migrateCvData` to `lib/cv/migrate.ts`, call once in API routes only | 30 min | Low | Single source of truth |
| A6. Move colors/theme to `lib/cv/theme.ts` + `lib/pdf/theme.ts` | 30 min | Low | Re-brand is one file |

### Phase B — Editor refactor (medium risk, big value)

| Step | Effort | Risk | Value |
|---|---|---|---|
| B1. Extract `Editable`, `AddButton`, `RemoveButton`, `BulletList`, `StarRow`, `Section`, `MinSection` into `components/cv/primitives/` | 1h | Low–med | Shared across templates |
| B2. Build `usePatchableCV()` hook that returns typed array helpers (`addItem('skills')`, `updateItem('skills', i, v)`, `removeItem('skills', i)`) | 2h | Med | Removes ~60 inline arrows |
| B3. Move `ModernLayout` and `MinimalistLayout` to separate files using primitives + hook | 3h | Med | CVPreview drops from 1618 → ~100 LoC |
| B4. Same split for `pdf-generator.tsx` → `lib/pdf/templates/{modern,minimalist}.tsx` | 2h | Med | Future Classic + Executive land cleanly |

### Phase C — Reliability (medium risk)

| Step | Effort | Risk | Value |
|---|---|---|---|
| C1. Wrap Claude/Whisper calls in `withRetry()` (3 tries, exp backoff, jitter) | 1h | Low | Cuts transient failures |
| C2. Bundle Inter + Noto fonts via `@fontsource/*` files referenced by `process.cwd()`, drop `fonts.gstatic.com` | 1h | Med | Permanent fix for the font 404 |
| C3. Move CVS row insert AFTER Claude success in `/api/generate-cv`; if Claude fails, no zombie row | 30 min | Med | Data integrity |
| C4. Fix `handleChange` stale closure: read `setCv` state inside the timeout | 15 min | Low | Bug fix |
| C5. `useDebouncedSave` hook used by both `handleChange` and `changeTemplate` | 30 min | Low | Removes duplicate ref pattern |
| C6. Add `cvs(user_id, created_at desc)` index in migration 006 | 15 min | Low | Dashboard scales |
| C7. Paginate dashboard (limit 20, cursor by `created_at`) | 1h | Med | Required before 100+ CVs/user |

### Phase D — Scale (med–high risk, can defer)

| Step | Effort | Risk | Value |
|---|---|---|---|
| D1. i18n split into `en.ts`/`ar.ts`/`ur.ts`, with `t()` keys typed from `en` | 1h | Low | Translator workflow + missing-key compile errors |
| D2. `useReducer` + `recordReducer` for the record-page state machine | 1.5h | Med | Clarity, easier to add stages |
| D3. Rate-limit `/api/{transcribe,generate-cv}` via Upstash/Postgres counter | 1h | Med | Cost control before paid tier |
| D4. Funnel metrics — instrument `record_started`, `record_complete`, `cv_generated`, `cv_downloaded` | 1h | Low | Conversion visibility |
| D5. Server-side entitlement check on `template` writes (block premium for free users) | 1h | Med | Security before launch |
| D6. Smoke tests: Playwright happy-path + Vitest unit on `migrateCvData` | 3h | Low | Refactor safety net |
| D7. Sentry / structured logging sink | 30 min | Low | Prod observability |

### Phase E — Polish (low risk, last)

| Step | Effort | Risk | Value |
|---|---|---|---|
| E1. CSP + security headers via `next.config.mjs` | 30 min | Low | Hardening |
| E2. Health endpoint `/api/health` that pings Supabase + Anthropic | 15 min | Low | Probes for ops |
| E3. React.memo + useCallback in CVPreview hot paths | 1h | Low | Edit-mode perf |

---

## 5. Sequenced "do next 4 weeks" plan

| Week | Focus | Deliverables |
|---|---|---|
| 1 | A1–A6 (foundation) | env, log, api helpers, types.gen, migrate split, theme |
| 2 | B1–B4 (editor refactor) | CVPreview at <100 LoC; templates in separate files |
| 3 | C1–C7 (reliability) | retries, bundled fonts, no-zombie-row, paginated dashboard, index migration |
| 4 | D1, D3, D5, D7 (pre-launch) | i18n split, rate limit, entitlement check, observability |

After week 4, tag `v0.3.0-production-ready` — the platform actually is.

---

## 6. What I executed in this audit (zero functional change)

- This document: `docs/ARCHITECTURE_REVIEW.md`.
- That is the only change. The audit is intentionally non-invasive — the recommendations above are the proposal, not the patch.

To start executing, tell me which **Phase** to begin with (A is recommended) and I will ship it in one go without changing functionality.
