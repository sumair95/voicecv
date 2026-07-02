# VoiceCV — Product & Engineering Decisions

A running log of the *why* behind the big calls. Newest first. For the *what*
(implementation detail) see `WORKLOG.md`, `CHANGELOG.md`, and `git log`.

Status legend: ✅ shipped · 🟡 partial / in progress · ⏸ deferred · 🔁 revisit with data

---

## Monetization

### Pricing model — $5 one-time Premium, not a subscription ✅ (2026-06-27)
**Decision:** Premium is a **one-time $5 purchase** (a pack of credits), not a monthly subscription.
**Why:** The target users are Gulf/South-Asian/Italian blue-collar and entry-level workers. Recurring billing is high-friction and high-churn for this demographic (many lack stable cards/recurring-payment habits). A small one-time price converts better and matches the "I need a CV *now*" job. Easy to add subscriptions later if data supports it.
**Trade-off:** Lower lifetime value per user than a subscription. Acceptable for v1; **🔁 revisit with conversion data.**

### Tiered packs — $3 "more CVs" vs $5 "Premium" ✅ (2026-06-28)
**Decision:** At the free wall, offer two choices: **$3 → 3 more standard CVs**, or **$5 → Premium** (Classic/Executive templates + AI cover letter + 3 CVs).
**Why:** Price-anchoring. The $3 option captures users who only need more CVs; the $5 option looks like clearly better value (only $2 more for designs + a cover letter), nudging upgrades. Premium also clears the CV wall so a premium buyer is never blocked.

### Free tier = 3 CVs, lifetime ✅ (2026-06-28)
**Decision:** Free accounts can create **3 CVs ever** (not 3 at a time). Deleting doesn't free a slot.
**Why:** Generous enough to prove value (most people need 1–2 CVs), but a real wall that creates upgrade pressure and caps our Whisper+Claude cost per free user. "Lifetime, not concurrent" prevents gaming the limit by deleting.
**Trade-off:** Slightly less generous feel. **🔁 revisit** the number (3) once we see how many CVs real users actually make.

### Credits enforced server-side only ✅ (2026-06-27)
**Decision:** Every entitlement check (CV limit, premium template unlock, cover-letter generation, PDF export) is enforced on the server. The client only *displays* state.
**Why:** Security. A tampered client must never be able to grant itself paid features. Credits are spent by `auth.uid()`-scoped `SECURITY DEFINER` DB functions so a user can't even spend on another account.

### Stripe Checkout (hosted) + webhook-only granting ✅ (2026-06-27)
**Decision:** Use Stripe's hosted Checkout (redirect), and grant credits **only** in a signature-verified, idempotent webhook.
**Why:** Stripe handles the card form + PCI; we never touch card data. Webhook-only granting means payment is the single source of truth — the client can't fake a purchase. Idempotency (one row per checkout session) makes Stripe's retries safe.

### Cover letter — generate/view/edit free, download paid ✅ (2026-07-01, updated 2026-07-02)
**Decision:** Anyone can generate, read, AND **fully edit** the cover letter for free (whole letter is an editable textarea — add hiring-manager name, company address, change date/position/wording, Save persists). **Only the polished PDF download requires Premium** (first download spends a cover-letter credit + unlocks that CV). Format follows a real formal business-letter sample (letterhead, date, recipient block, "Re:" line, 4–5 paragraphs, sign-off).
**Why:** Moving the paywall to *download only* is the strongest funnel — the user invests effort perfecting their letter, then pays to take the formatted PDF. Editing was requested by Sumair (users need to fill recipient details). The formatting/layout is the paid value; plain-text copy doesn't capture it.
**Trade-off:** Free users can now copy the text out (the earlier copy-prevention was dropped to allow editing) — accepted, since the formatted PDF is the real deliverable. Free Claude calls bounded by the 3-CV free limit. **🔁 revisit** with conversion data (`ANALYTICS.md`).

### Regional pricing — true FX via Stripe Adaptive Pricing ✅ (2026-06-30)
**Decision:** Show local currency (PKR/INR/SAR/USD) and charge in it, but keep the **same $5/$3 value** everywhere (true FX, not cheaper local price levels). The real charge + conversion is done by **Stripe Adaptive Pricing** (dashboard toggle); our own pages show an **indicative** local price (timezone-detected, "≈" prefix).
**Why:** Adaptive Pricing handles FX/currency-selection correctly with zero FX risk to us and no price tables to maintain. Timezone detection for the *display* needs no geo-IP dependency/key/latency. Purchasing-power (cheaper PK/IN) was considered and **🔁 deferred** — revisit if conversion data shows the FX price is too high for those markets.
**Trade-off:** ₨1,400 / ₹420 is the real-value price, not a discount, so this is a trust/clarity win more than an affordability one. Display rates are approximate and need occasional manual refresh (`lib/pricing.ts`).
**Requires:** Adaptive Pricing enabled in the Stripe Dashboard (Settings → Adaptive Pricing).

### Cover-letter teaser is blurred, not hidden ✅ (2026-06-28)
**Decision:** Free users *see* the cover-letter panel as a blurred, non-downloadable sample with an "Unlock with Premium" CTA, rather than hiding it.
**Why:** Showing the feature (even blurred) creates desire and communicates value far better than an invisible/locked feature. Classic freemium nudge.

---

## Languages

### Input language ≠ output language ✅ (2026-06-26)
**Decision:** Decouple the language someone *speaks* from the language their CV is *written in*. Users pick the CV's output language in the record flow.
**Why:** Real cases break the 1:1 assumption — an Urdu speaker in Italy wants an Italian CV; an Italian applying to a multinational wants English. The infrastructure (`outputLanguageFor`, `cvs.language`) made this cheap once Italian existed.

### CV output limited to EN + IT for now 🟡 (2026-06-26)
**Decision:** Offer **English** and **Italian** as CV output languages. Arabic/Urdu output is **⏸ deferred**.
**Why:** EN/IT are LTR/Latin and render safely in the existing PDF templates. Arabic/Urdu as *output* need the PDF templates verified/fixed for RTL — untested risk. AR/UR remain fully supported as *UI* and *spoken* languages.

### Italian added as 4th language ✅ (2026-06-26)
**Decision:** Add Italian (UI + recording + Italian CV output).
**Why:** Concrete go-to-market: a partner in Italy wants to offer VoiceCV on their job-search platform. First real distribution channel.

---

## CV content & design

### Dropped the STAR achievement format ✅ (2026-06-26)
**Decision:** "Key Achievements" is a simple bulleted list (e.g. "Employee of the Month 2023"), not a forced Situation/Task/Action/Result story.
**Why:** Real users list awards/wins, they don't narrate STAR stories. STAR was over-engineered for the audience and made the question confusing. Simpler = more answers, better CVs.

### Two free templates, two premium ✅ (2026-06-27)
**Decision:** Modern + Minimalist are free; Classic + Executive are Premium.
**Why:** Free users still get a genuinely good CV (no dark patterns), while the premium designs give a real reason to pay. Honest freemium.

### Honest marketing over fake social proof ✅ (2026-06-25/27)
**Decision:** Removed fabricated stats ("10,000+ CVs") and fake testimonials; replaced with real sample CVs and truthful numbers.
**Why:** Recruiters/users notice fakery, and it erodes trust. Real example CVs are also *more* convincing than invented quotes.

---

## Deferred / to revisit
- ⏸ **Pre-generated TTS audio** for the "Listen to question" feature so it works on devices without AR/UR/IT voices (currently browser SpeechSynthesis, hidden when no voice).
- ⏸ **Arabic/Urdu CV output** (needs RTL PDF work).
- 🔁 **Analytics-driven pricing/limit tuning** — the $5/$3/3-CV numbers are intuition; revisit with funnel + conversion data (see `ANALYTICS.md`).
- ⏸ **User feedback loop** — no real job-seeker feedback captured yet.
- ⏸ **Demo video** on the landing (`VideoDemo` is wired; awaiting a URL).
