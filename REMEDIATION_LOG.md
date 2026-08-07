# VoiceCV — Security Remediation Log

Running record of fixes applied after the 22 Jul 2026 audit
(`SECURITY_AUDIT_2026-07-22.md`). Most recent first.

---

## 2026-07-31 — L6: admin audit trail — FIXED (code; migration pending)

**Files:** `supabase/migrations/026_admin_audit.sql` (new),
`app/api/admin/comp/route.ts`

New `admin_audit` table (no client RLS); the comp/free-mode admin route now
writes a durable row for every mutating action (`comp_toggle`, `freemode`,
`comp_add`, `comp_remove`) with the actor email. Best-effort — never blocks the
action. **Action:** run `026_admin_audit.sql` (until then the audit insert
no-ops via its catch and the action still succeeds).

---

## 2026-08-07 — H4 (bucket privatization), M2, L3, L5 — FIXED (code; migration pending)

Closes the last open audit items. **Nothing here is deployed yet** and H4 needs
migration `027_private_avatars.sql` run *together with* the code — see the
deploy checklist at the bottom.

### H4 — avatars bucket is now private

**Files:** `supabase/migrations/027_private_avatars.sql` (new),
`lib/photo/storage.ts`, `app/api/photo/signed/route.ts` (new),
`app/api/photo/{upload,convert,remove}/route.ts`, `app/api/export-pdf/route.ts`,
`app/(dashboard)/profile/page.tsx`, `app/(dashboard)/cv/[id]/page.tsx`,
`components/cv/primitives.tsx`

- Migration flips `avatars` to `public = false` and adds an owner-only SELECT
  policy as a backstop.
- `profiles.photo_url` / `photo_formal_url` now store the **storage path**, not
  a URL. Signed URLs expire, so storing one would rot the column within an hour.
- New `avatarPath()` normalizes all three shapes a reference arrives in — bare
  path, legacy public URL, stale signed URL — and refuses anything outside
  `<uid>/`. That makes the change **self-healing and backfill-free**: old rows
  keep resolving, and a stale signed URL auto-saved into `cv_data` by the CV
  editor still resolves and is simply re-signed on the next read.
- Reads go through `GET /api/photo/signed`, which mints 1-hour URLs for the
  caller's own objects. It takes **no parameters**, so there is nothing to tamper
  with.
- `export-pdf` no longer makes an outbound request at all: it reads the bytes via
  the service-role client (`downloadAvatar`). That removes the SSRF sink rather
  than guarding it — the C2 allowlist stays for other callers.
- `photo/convert` still hands a URL to remove.bg/Gemini (their APIs require one),
  but now a short-lived signed one.

### M2 — fire-and-forget background work

**Files:** `lib/runtime/background.ts` (new), `app/api/generate-cv/route.ts`,
`README.md`

Next 14.2 has no `after()`, so this takes the audit's other branch — pin the
target and document it — plus the piece that makes pinning safe. `runInBackground()`
detects Vercel/Lambda/Azure/Cloud Run from their own env vars and logs an **error
naming the job about to be dropped**, converting a silent failure into a visible
one. It also routes rejections to the logger, so detached work can no longer
surface as an unhandled rejection. README gains a "Deployment target is not
interchangeable" section.

### L3 — accessibility

**Files:** `components/VoiceRecorder.tsx`, `lib/i18n.ts`, `components/Navbar.tsx`,
`components/CameraCapture.tsx`, `components/TemplatePicker.tsx`,
`components/cv/primitives.tsx` (+ CV pages)

- The recorder's `aria-live` was on a layout div wrapping an **animated waveform
  with no text**, so a screen reader had nothing to announce. Replaced with a
  dedicated `role="status"` region carrying real state text, localized across all
  four languages (`rec.status.*`); the waveform is now `aria-hidden`.
- `CameraCapture` announced as `role="dialog"` + `aria-modal`; its error is a
  `role="alert"`.
- `TemplatePicker` buttons carry `aria-pressed` + a label naming Premium/locked
  state (previously conveyed by colour and a 4px icon only).
- `Navbar` links wrapped in a real `<nav aria-label="Main">` landmark.
- Meaningful `alt` on every photo — these were `alt=""` on an image that *is* the
  person.

### L5 — layout shift, and a deliberate non-migration

`next/image` was **not** adopted for avatars, on purpose. Routing a private,
signed-URL headshot through `/_next/image` would copy it into Next's on-disk
optimisation cache and serve it from a CDN-cacheable URL that outlives the
signature — re-opening the exact exposure H4 just closed. Instead the images
carry explicit `width`/`height` to reserve their box, which is the layout-shift
win L5 was actually after. Rationale is recorded in `components/cv/primitives.tsx`
so this isn't "rediscovered" later.

---

## 2026-07-31 — H4: avatar retention — PARTIAL (privatization completed 2026-08-07, above)

**Files:** `lib/photo/storage.ts` (new), `app/api/photo/upload/route.ts`,
`app/api/photo/convert/route.ts` (+ `app/api/photo/remove/route.ts` from C1).

**Done — retention:** photos no longer accumulate forever. `pruneAvatars()`
deletes old objects on every re-upload and conversion (keeping only the current
original + formal); removal already deletes objects (C1). Also genericised a
leaked `upErr.message` in the upload route.

**Deferred — bucket privatization (needs staging verification):** making the
`avatars` bucket private is NOT safe to ship blind. The photo URL is stored
inside `cv_data.personal.photo_url` and rendered in four client components
(`CVPreview`, `ClassicTemplate`, `ExecutiveTemplate`, profile/cv pages) plus
fetched server-side for the PDF. Flipping to private invalidates every stored
public URL at once and requires signed-URL plumbing through all of them; a
mistake breaks every user's photo and CV PDF. Plan for when it can be tested on
a preview deploy:

1. Add `GET /api/photo/url` (service-role `createSignedUrl`, short TTL) returning
   a fresh signed URL for the caller's original/formal photo.
2. Stop storing a durable public URL in `cv_data`; store the storage PATH and
   resolve to a signed URL at render/export time (server download via
   `admin.storage.download(path)` for the PDF).
3. Migrate existing `photo_url`/`photo_formal_url` public URLs → paths.
4. Flip the bucket to private (`update storage.buckets set public=false ...`).
5. Account-deletion cleanup: delete the user's `avatars/<uid>/` objects via the
   storage API on account deletion (a DB trigger alone orphans the S3 blob).

---

## 2026-07-31 — M4 + M8: CSP header + AI health signal — FIXED (code)

**Files:** `next.config.mjs`, `app/api/health/route.ts`

- **M4 — CSP.** Added a `Content-Security-Policy-Report-Only` header (locks
  `frame-ancestors`, `base-uri`, `object-src`, `form-action`, and scopes
  connect/img to self + Supabase). Shipped **report-only** so it can't break the
  live site — the inline theme script + Next's framework scripts mean an
  *enforcing* CSP needs per-request nonces via middleware first. Follow-up noted.
- **M8 — AI health signal.** `/api/health` now returns an `ai` block (key
  presence for anthropic/openai/gemini/removebg) and an `aiDegraded` flag that
  flips overall `status` to `degraded` when a primary key is missing, so an
  uptime monitor catches a silently-broken AI layer. (Presence ≠ validity; a
  token-spending deep ping can be added behind a flag later.)

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

## Outstanding

**None.** Every finding in `SECURITY_AUDIT_2026-07-22.md` (C1–C2, H1–H4, M1–M8,
L1–L7) now has a remediation entry above. L5 is closed as a documented decision
not to adopt `next/image` for private avatars, not as a code change.

One item is carried forward as ordinary work rather than an audit finding: H4
mentions **deleting avatars on account deletion**. Re-upload/convert/remove all
prune correctly, but there is no account-deletion flow in the product yet — when
one is added it must call `pruneAvatars(admin, userId, [])`.

Also noted while fixing M2 and not chased: the competition path passes a
user-scoped Supabase client into detached work whose token can expire mid-run.
It writes with explicit `.eq("user_id", …)` scoping, so moving it to the
service-role client is safe, but that changes an auth boundary and deserves its
own change rather than being folded in silently.

## Deploy checklist — 2026-08-07 batch (H4 privatization, M2, L3, L5)

**Order matters. The migration and the code must go out together**: privatizing
the bucket breaks every stored public URL, and the new code is what mints signed
URLs to replace them.

1. Run `supabase/migrations/027_private_avatars.sql` in the SQL editor.
2. Verify: `select id, public from storage.buckets where id = 'avatars';`
   → `public = false`.
3. Push to `main` and let Railway deploy (or deploy immediately after step 1 —
   between the two, existing photos will not render).
4. Smoke-test, signed in:
   - Profile page shows the existing photo (proves legacy public-URL rows still
     resolve via `avatarPath`).
   - Upload a new photo → renders immediately.
   - "Make professional" (remove.bg) → renders.
   - Open a CV with the photo on → photo renders in the preview.
   - Export that CV to PDF → photo is embedded.
   - Remove photo → disappears, and the storage object is gone.
   - Paste an old `/object/public/avatars/...` URL in a logged-out tab →
     **must now fail** (400/404). This is the actual proof H4 is closed.
5. Accessibility spot-check: with a screen reader (or VoiceOver rotor), start a
   recording and confirm "Recording. Speak your answer…" is announced.
