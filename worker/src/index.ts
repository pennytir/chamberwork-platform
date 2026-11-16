import { Hono } from "hono";
import type { Env } from "./auth";
import { createAuth } from "./auth";
import { walletRoutes, handleStripeWebhook } from "./wallet";
import { workspaceRoutes } from "./workspaces";
import { billingTick } from "./metering";

const app = new Hono<{ Bindings: Env }>();

// Better-Auth (D1-backed): auth, orgs, OAuth 2.1 provider, admin
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

// Stripe webhook: top-up payments credit the wallet
app.post("/api/webhook/stripe", (c) => handleStripeWebhook(c.env, c.req.raw));

// Wallet: balance + top-up checkout
app.route("/api/wallet", walletRoutes);

// Workspace lifecycle: rent (start), stop, snapshot, download, restore
app.route("/api/workspaces", workspaceRoutes);

// Everything else: the Astro frontend (static assets)
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));

export default {
  fetch: (req: Request, env: Env, ctx: ExecutionContext) => app.fetch(req, env, ctx),
  // Hourly: reconcile usage from Analytics Engine, deduct credits, auto-stop broke wallets
  scheduled: (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    ctx.waitUntil(billingTick(env));
  },
} satisfies ExportedHandler<Env>;

export { Workspace } from "./workspace";
