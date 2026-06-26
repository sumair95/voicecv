import { getStripe } from "@/lib/stripe";
import { getAuthContext } from "@/lib/api/auth";
import { handle } from "@/lib/api/handle";
import { ok, unauthorized } from "@/lib/api/respond";
import { PREMIUM_PRICE_USD_CENTS } from "@/lib/premium";

export const runtime = "nodejs";

// Creates a Stripe Checkout Session for the $5 Premium Pack and returns its
// URL. The client redirects to it; entitlement is granted only by the webhook
// after Stripe confirms payment — never here, never by the client.
export const POST = handle("checkout", async ({ req, log }) => {
  const { user } = await getAuthContext(req);
  if (!user) return unauthorized();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://vocv.app";
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: PREMIUM_PRICE_USD_CENTS,
          product_data: {
            name: "VoiceCV Premium Pack",
            description:
              "2 premium-template CVs (Classic & Executive) + 1 professional cover letter",
          },
        },
      },
    ],
    client_reference_id: user.id,
    metadata: { user_id: user.id },
    success_url: `${appUrl}/dashboard?premium=success`,
    cancel_url: `${appUrl}/dashboard?premium=cancel`,
  });

  log.info("checkout session created", { userId: user.id, sessionId: session.id });
  return ok({ url: session.url });
});
