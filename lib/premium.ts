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
/**
 * Master switch for the premium UI. Stays OFF until Stripe is configured, so
 * deploying the payment code never shows a broken "$5" button. Flip on by
 * setting NEXT_PUBLIC_PREMIUM_ENABLED=true in the env (requires a redeploy,
 * since NEXT_PUBLIC_* is inlined at build time).
 */
export const PREMIUM_ENABLED =
  process.env.NEXT_PUBLIC_PREMIUM_ENABLED === "true";

export const PREMIUM_PRICE_USD_CENTS = 500;

export const PREMIUM_PACK = {
  premiumCvCredits: 2,
  coverLetterCredits: 1,
} as const;
