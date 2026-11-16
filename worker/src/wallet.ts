import { Hono } from "hono";
import type { Env } from "./auth";

/**
 * Credit wallet: top-up model (prepaid credits, no subscriptions).
 * Top-ups via Stripe Checkout (one-time payment) -> webhook credits the wallet.
 * Usage deducted hourly by the billing cron from Analytics Engine data.
 * Balance <= 0 -> container auto power-down.
 */
export const walletRoutes = new Hono<{ Bindings: Env }>();

// Get current balance (org or solo user)
walletRoutes.get("/balance", async (c) => {
  const { orgId } = c.req.query();
  if (!orgId) return c.json({ error: "orgId required" }, 400);
  const row = await c.env.DB.prepare("SELECT credits_balance_cents FROM organization WHERE id = ?")
    .bind(orgId).first<{ credits_balance_cents: number }>();
  return c.json({ balanceCents: row?.credits_balance_cents ?? 0 });
});

// Create a Stripe Checkout session for a one-time top-up pack
walletRoutes.post("/topup", async (c) => {
  const { orgId, userId, email, amountCents } = await c.req.json<{
    orgId?: string; userId: string; email: string; amountCents: number;
  }>();

  if (!userId || !amountCents || amountCents < 500) {
    return c.json({ error: "Minimum top-up is $5.00" }, 400);
  }

  const { Stripe } = await import("stripe");
  const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });

  const session = await stripe.checkout.sessions.create({
    mode: "payment", // one-time top-up, NOT a subscription
    customer_email: email,
    line_items: [{
      price_data: {
        currency: "usd",
        unit_amount: amountCents,
        product_data: { name: "Chamberwork credit top-up" },
      },
      quantity: 1,
    }],
    metadata: { userId, orgId: orgId ?? "", amountCents: String(amountCents) },
    success_url: `${c.env.APP_ORIGIN}/dashboard?topup=success`,
    cancel_url: `${c.env.APP_ORIGIN}/dashboard?topup=cancelled`,
  });

  return c.json({ url: session.url });
});

// Stripe webhook: credit the wallet when a top-up payment completes
export async function handleStripeWebhook(env: Env, request: Request): Promise<Response> {
  const { Stripe } = await import("stripe");
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { httpClient: Stripe.createFetchHttpClient() });

  const body = await request.text();
  const sig = request.headers.get("stripe-signature") ?? "";
  let event: import("stripe").Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const orgId = session.metadata?.orgId || null;
    const amountCents = Number(session.metadata?.amountCents ?? session.amount_total ?? 0);

    if (userId && amountCents > 0) {
      if (orgId) {
        await env.DB.prepare(
          "UPDATE organization SET credits_balance_cents = credits_balance_cents + ? WHERE id = ?"
        ).bind(amountCents, orgId).run();
      }
      await env.DB.prepare(
        `INSERT INTO credit_transaction (id, organization_id, user_id, amount_cents, kind, description, stripe_payment_intent, created_at)
         VALUES (?, ?, ?, ?, 'topup', 'Top-up via Stripe', ?, ?)`
      ).bind(crypto.randomUUID(), orgId, userId, amountCents,
        typeof session.payment_intent === "string" ? session.payment_intent : null, Date.now()).run();
    }
  }

  return new Response(JSON.stringify({ received: true }), { headers: { "content-type": "application/json" } });
}
