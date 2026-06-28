import { getStripe } from "@/lib/stripe";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";
import { logEvent } from "@/lib/analytics-server";
import {
  PREMIUM_PRICE_USD_CENTS,
  CV_PACK_PRICE_USD_CENTS,
  CV_PACK_CREDITS,
  type PackId,
} from "@/lib/premium";

export const runtime = "nodejs";

const PACKS: Record<PackId, { cents: number; name: string; description: string }> = {
  cv: {
    cents: CV_PACK_PRICE_USD_CENTS,
    name: "VoiceCV — More CVs",
    description: `Create ${CV_PACK_CREDITS} additional CVs`,
  },
  premium: {
    cents: PREMIUM_PRICE_USD_CENTS,
    name: "VoiceCV Premium Pack",
    description:
      "2 premium-template CVs (Classic & Executive) + 1 professional cover letter + 3 more CVs",
  },
};

// Creates a Stripe Checkout Session for the chosen pack and returns its URL.
// Entitlement is granted only by the webhook after Stripe confirms payment.
export const POST = handle("checkout", async ({ req, log }) => {
  const { user, supabase } = await getAuthContext(req);
  if (!user) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { pack?: PackId };
  const pack: PackId = body.pack === "cv" ? "cv" : "premium";
  const info = PACKS[pack];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vocv.app";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: info.cents,
          product_data: { name: info.name, description: info.description },
        },
      },
    ],
    client_reference_id: user.id,
    metadata: { user_id: user.id, pack },
    success_url: `${appUrl}/dashboard?premium=success`,
    cancel_url: `${appUrl}/dashboard?premium=cancel`,
  });

  await logEvent(supabase, user.id, "checkout_started", { pack });
  log.info("checkout session created", { userId: user.id, pack, sessionId: session.id });
  return ok({ url: session.url });
});
