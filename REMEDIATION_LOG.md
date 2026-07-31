# VoiceCV — Security Remediation Log

Running record of fixes applied after the 22 Jul 2026 audit
(`SECURITY_AUDIT_2026-07-22.md`). Most recent first.

---

## 2026-07-31 — M3: atomic webhook credit grant — FIXED (code; migration pending)

**Risk:** the Stripe webhook did read-modify-write on credit columns; concurrent
completed-events for one user could lose a grant.

**Files:** `supabase/migrations/025_grant_credits.sql` (new),
`app/api/stripe/webhook/route.ts`

- New `grant_credits(user, cv, premium_cv, cover_letter, formal_photo)` RPC does
  the increments in one atomic UPDATE.
- Webhook calls it after the idempotency insert. **If the RPC is unavailable
  (migration not yet run) it falls back to the old read-modify-write**, so a
  paying customer is never left without credits.

**Action:** run `025_grant_credits.sql` in Supabase to activate the atomic path.

---

## 2026-07-31 — H2: durable rate limiter — FIXED (code; migration pending)

**Risk:** the limiter was an in-memory `Map`, so counters were per-instance —
ineffective at scale, leaving paid AI calls effectively uncapped.

**Files:** `supabase/migrations/024_rate_limits.sql` (new), `lib/rate-limit.ts`,
+ 9 route call sites (`export-pdf`, `generate-cover-letter`, `generate-cv`,
`jobs/improve`, `jobs/search`, `jobs/suggest-roles`, `jobs/tailor`,
`photo/convert`, `transcribe`).

- New `rate_limits` table + atomic `rate_limit_take(key, max, window_ms)` RPC
  (row-locked upsert, cluster-safe).
- `take()` is now async: calls the RPC via the service-role client, and **falls
  back to the old in-memory counter if the RPC is unavailable** — so deploying
  the code before running migration 024 degrades gracefully instead of breaking.
- All 9 call sites updated to `await take(...)`.

**Action:** run `024_rate_limits.sql` in Supabase to activate the durable path.
Until then it silently uses the in-memory fallback (today's behaviour).

---

## 2026-07-31 — Batch 2: M7, M6, M5, L4, L2, L1 — FIXED (code)

Self-contained, no DB changes. One commit.

- **M7 — hardcoded model ids centralised.** New `lib/ai/models.ts` exports
  `CLAUDE_TEXT_MODEL` / `OPENAI_TEXT_MODEL` / `WHISPER_MODEL` /
  `GEMINI_IMAGE_MODEL` (env-overridable). Replaced all 8 hardcoded strings
  (`lib/claude.ts` via `cv-models/claude.ts`, `cv-models/openai.ts`,
  `cv-models/judge.ts`, `cover-letter.ts`, `jobs/match.ts`, `jobs/suggest.ts`,
  `jobs/tailor.ts`, `jobs/improve` route, `whisper.ts`, `photo/classify.ts`,
  `photo/gemini.ts`).
- **M6 — transcribe upload cap.** `/api/transcribe` now rejects empty, >24 MB,
  and clearly non-audio blobs before hitting Whisper.
- **M5 — /api/stats amplification.** `free_mode` now cached 10s instead of a
  service-role round-trip on every landing-page hit.
- **L4 — error-message leakage.** The `handle()` catch-all now returns a generic
  message + `reqId` (detail logged server-side only). The explicit
  `serverError(err.message)` sites in export-pdf, export-cover-letter-pdf,
  photo/convert and the jobs/search 502 were genericised too.
- **L2 — /api/debug/comp** now admin-gated (`isAdminEmail`).
- **L1 — inactivity logout** raised 3 min → 15 min, with a 60s warning toast and
  a `setInactivityPaused()` hook the recorder calls so a user speaking a long
  answer is never signed out mid-recording.

Verified: all 23 changed files pass a syntax check and every `@/` import
resolves. (Full `tsc`/`next build` couldn't run in the review sandbox — build
locally before relying on the deploy.)

---

## 2026-07-24 — H1: prompt injection in CV tailor — FIXED (code)

**Risk:** `jobDescription` is third-party text from job boards (attacker-
controllable) and the model output was written straight over `cvs.cv_data`. A
poisoned listing could rewrite the candidate's contact details or employers.

**Files:** `lib/jobs/tailor.ts`

- Untrusted job text now wrapped in `<job_posting>…</job_posting>` delimiters
  with a system-prompt note: treat as data, never instructions.
- `jobTitle` sanitised (`<`/`>` stripped, length-capped) before interpolation.
- New `enforceFacts(original, tailored)`: after the model returns, all
  verifiable facts are **restored in code** from the original CV —
  `personal.*` (except `job_title`), employers + durations (pinned by index),
  `education`, `certificates`, `languages`, `socials`, `hobbies`,
  `achievements`. The model may only influence `objective`, `job_title`,
  experience bullet wording, and skill ordering.

**Status:** code complete, not yet deployed. No DB change needed.

---

## 2026-07-24 — H3: unvalidated photo upload (stored XSS) — FIXED (code)

**Risk:** `/api/photo/upload` trusted the client `Content-Type`, so an
SVG-with-`<script>` labelled `image/jpeg` could be stored in the PUBLIC avatars
bucket and served as an XSS/phishing page from our storage origin.

**Files:** `lib/net/image-bytes.ts` (new), `app/api/photo/upload/route.ts`,
`app/api/photo/convert/route.ts`

- New `sniffImageType(buf)` — decides the type from magic bytes (JPEG/PNG/WEBP
  only; SVG rejected). `extFor(type)` names the object from the sniff.
- Upload route: rejects anything not a real raster image; stored `Content-Type`
  and extension come from the sniff, never the upload header/filename.
- Convert route: the processed bytes (remove.bg / Gemini output — third party)
  are re-sniffed before hitting the public bucket, replacing the old PNG-only
  inline check.

**Status:** code complete, not yet deployed. No DB change needed.

---

## 2026-07-24 — C2: SSRF in server-side image fetch — FIXED (code)

**Risk:** `export-pdf` fetched `cv_data.personal.photo_url` (client-writable)
with no host restriction and embedded the bytes in the downloaded PDF — a
working exfiltration channel to internal/metadata endpoints. Same pattern in
`lib/photo/gemini.ts`.

**Files:** `lib/net/safe-image.ts` (new), `app/api/export-pdf/route.ts`,
`lib/photo/gemini.ts`, `app/api/photo/convert/route.ts`

- New `isAllowedImageUrl()` — https + exact Supabase-host match, fails closed.
- Applied at all three fetch sites; each also uses `redirect: "error"` so a 302
  into an internal address can't reopen the hole.

**Status:** code complete, not yet deployed. No DB change needed.

---

## 2026-07-24 — C1: entitlement columns were client-writable — FIXED (DB + code)

**Risk:** RLS `for all using (auth.uid() = …)` + default table grants let any
logged-in user run `supabase.from('profiles').update({ premium_cv_credits: 999 })`
from the browser and grant themselves unlimited premium — the credit RPCs were
bypassed entirely.

**Files:** `supabase/migrations/023_lock_entitlement_columns.sql` (new),
`app/api/unlock-cv-premium/route.ts`, `app/api/jobs/tailor/route.ts`,
`app/api/export-cover-letter-pdf/route.ts`, `app/api/photo/remove/route.ts`
(new), `app/(dashboard)/profile/page.tsx`

- Migration drops table-wide UPDATE/INSERT grants on `profiles` + `cvs` and
  re-grants only content columns. Entitlement flags/credits are now
  service-role-only.
- Three comp-account unlock branches moved to the service-role client
  (`.eq("user_id", user.id)` now carries the scoping).
- "Remove photo" moved from a direct browser write to a new
  `/api/photo/remove` route (which also deletes the storage objects).

**Status (DB):** ✅ migration run on production 2026-07-24, verified via
`information_schema.column_privileges` — only content columns are grantable to
`authenticated`.
**Status (code):** complete, **not yet deployed** — must ship with the DB
change or "remove photo" + comp unlocks break.

---

## Outstanding (from the audit, not yet started)

- **H2** — rate limiter is per-process/in-memory; move to Postgres/Upstash.
- **H4** — avatars bucket is public + never expires; make private + signed URLs
  + delete on account deletion. (Partly helped by `/api/photo/remove` cleanup.)
- **M1–M8, L1–L7** — see the audit.

## Deploy checklist for the current batch (C1, C2, H3, H1)

1. `git push` the edited + new files to `main`.
2. Deploy the app (must go out together with migration 023, already run).
3. Smoke-test: unlock premium template, cover-letter PDF, tailor a CV, remove
   photo, export CV PDF with photo, upload a new photo (try renaming a `.svg`
   to `.jpg` — must be rejected).
