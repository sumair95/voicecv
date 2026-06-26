import Stripe from "stripe";

/**
 * Lazy Stripe client. Keys are read at call time (NOT at module load) so the
 * app still boots when Stripe isn't configured yet — only the payment routes
 * fail, with a clear message, until STRIPE_SECRET_KEY is set in the env.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  if (!cached) cached = new Stripe(key);
  return cached;
}
