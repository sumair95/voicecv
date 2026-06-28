/**
 * Premium / credit constants — client-safe (no Stripe import, safe in browser).
 *
 * Tiers:
 *   - Free: FREE_CV_LIMIT CVs.
 *   - $3 "CV pack": +CV_PACK_CREDITS more CVs.
 *   - $5 "Premium pack": premium templates + a cover letter, AND +cvCredits
 *     more CVs (so Premium also clears the free-CV wall).
 *
 * Entitlement is enforced server-side via credits/limits; the client only
 * displays them. Granting happens in the Stripe webhook; consuming happens in
 * the unlock / cover-letter / generate routes.
 */

// Premium is live — the UI is always shown. (Previously gated behind a
// build-time NEXT_PUBLIC_PREMIUM_ENABLED flag while Stripe was being set up.)

/** How many CVs a free account can hold before needing to buy more. */
export const FREE_CV_LIMIT = 3;

export const CV_PACK_PRICE_USD_CENTS = 300;
export const CV_PACK_CREDITS = 3;

export const PREMIUM_PRICE_USD_CENTS = 500;
export const PREMIUM_PACK = {
  premiumCvCredits: 2,
  coverLetterCredits: 1,
  cvCredits: 3,
} as const;

export type PackId = "cv" | "premium";
