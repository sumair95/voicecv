import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { PREMIUM_PACK, CV_PACK_CREDITS } from "@/lib/premium";
import { logger } from "@/lib/log";

export const runtime = "nodejs";

// Stripe webhook — the ONLY place premium credits are granted. Verifies the
// signature against STRIPE_WEBHOOK_SECRET so a forged request can't grant
// credits. Idempotent: each checkout session is recorded once (primary key),
// so Stripe's retries never double-grant.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    logger.warn("stripe webhook signature failed", { err });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id ?? session.metadata?.user_id ?? null;

    if (userId && session.payment_status === "paid") {
      const admin = createServiceClient();

      // Idempotency gate: insert the session id. If it's already there, this
      // is a retry of an already-processed event — skip granting.
      const { error: insertErr } = await admin.from("purchases").insert({
        id: session.id,
        user_id: userId,
        amount_total: session.amount_total,
        currency: session.currency,
      });

      if (insertErr) {
        logger.info("stripe webhook duplicate ignored", { sessionId: session.id });
      } else {
        const pack = session.metadata?.pack === "cv" ? "cv" : "premium";
        const { data: profile } = await admin
          .from("profiles")
          .select("premium_cv_credits, cover_letter_credits, cv_credits")
          .eq("id", userId)
          .single();

        const update =
          pack === "cv"
            ? { cv_credits: (profile?.cv_credits ?? 0) + CV_PACK_CREDITS }
            : {
                premium_cv_credits:
                  (profile?.premium_cv_credits ?? 0) + PREMIUM_PACK.premiumCvCredits,
                cover_letter_credits:
                  (profile?.cover_letter_credits ?? 0) + PREMIUM_PACK.coverLetterCredits,
                cv_credits: (profile?.cv_credits ?? 0) + PREMIUM_PACK.cvCredits,
              };

        await admin.from("profiles").update(update).eq("id", userId);
        await admin.from("events").insert({
          user_id: userId,
          event: "purchase_completed",
          props: { pack, amount: session.amount_total, currency: session.currency },
        });
        logger.info("pack granted", { userId, pack, sessionId: session.id });
      }
    }
  }

  return NextResponse.json({ received: true });
}
