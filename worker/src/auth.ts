import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { admin, organization, jwt, apiKey, bearer, multiSession, lastLoginMethod } from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

export interface Env {
  DB: D1Database;
  USAGE: AnalyticsEngineDataset;
  SNAPSHOTS: R2Bucket;
  WORKSPACE: DurableObjectNamespace;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  APP_ORIGIN: string;
  WORKSPACE_DOMAIN: string;
}

export function createAuth(env: Env) {
  const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(), // required on Workers
  });

  return betterAuth({
    // D1 replaces PostgreSQL — sqlite dialect via drizzle adapter
    database: drizzleAdapter(drizzle(env.DB), { provider: "sqlite" }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_ORIGIN,

    plugins: [
      admin(),
      organization(),
      jwt(),
      apiKey(),
      bearer(),
      multiSession(),
      lastLoginMethod(),
      oauthProvider({
        loginPage: "/sign-in",
        consentPage: "/consent",
        resources: [`https://*.${env.WORKSPACE_DOMAIN}`],
      }),
      stripe({
        stripeClient,
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        // Top-up model: one-time credit packs, not subscriptions.
        // Credits are added in the checkout.session.completed webhook handler.
        subscription: { enabled: false },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
