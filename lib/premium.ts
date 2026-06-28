/**
 * Premium pack — client-safe constants (no Stripe import, safe in the browser).
 *
 * One $5 purchase grants a bundle of credits:
 *   - 2 premium-template CV unlocks (Classic / Executive)
 *   - 1 professional cover letter
 *
 * Entitlement is enforced server-side via these credits; the client only
 * displays them. Granting happens in the Stripe webhook; consuming happens in
 * the unlock / cover-letter routes.
 */
// Premium is live — the UI is always shown. (Previously gated behind a
// build-time NEXT_PUBLIC_PREMIUM_ENABLED flag while Stripe was being set up.)
export const PREMIUM_PRICE_USD_CENTS = 500;

export const PREMIUM_PACK = {
  premiumCvCredits: 2,
  coverLetterCredits: 1,
} as const;
