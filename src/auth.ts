import { betterAuth } from "better-auth";
import { 
  admin, 
  organization, 
  jwt, 
  apiKey,
  bearer,
  multiSession,
  lastLoginMethod
} from "better-auth/plugins";
import { oauthProvider } from "@better-auth/oauth-provider";
import { stripe } from "@better-auth/stripe";
import { Pool } from "pg";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2024-11-20.acacia" as any
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/chamberwork",
});

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || "chamberwork-super-secret-key-32-chars-long",
  baseURL: process.env.BETTER_AUTH_URL || "https://app.chamberwork.space",
  disabledPaths: ["/token"], // Required by OAuth provider mode
  
  // Custom schema & database mapping
  session: {
    storeSessionInDatabase: true,
  },

  plugins: [
    // 1. Administration plugin for admin APIs & user management
    admin({
      defaultRole: "user",
      adminRole: "superadmin"
    }),

    // 2. Organization / Workspace plugin for Team subdomains
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: 100,
    }),

    // 3. Central OAuth 2.1 Provider for Single Sign-On (SSO) to Tenant VPS instances
    jwt({ disableSettingJwtHeader: true }),
    oauthProvider({
      loginPage: "/sign-in",
      consentPage: "/consent",
      // Tenant VPS instances are registered clients allowed to exchange tokens
      resources: [
        "https://*.chamberwork.space"
      ],
    }),

    // 4. Stripe Subscription Plugin for Tiered Billing
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder",
      subscription: {
        enabled: true,
        plans: [
          {
            name: "Solo CDE (1GB)",
            priceId: process.env.STRIPE_PRICE_SOLO_1GB || "price_solo_1gb",
            annualDiscountPriceId: undefined,
            limits: {
              workspaces: 1,
              ramGb: 1
            }
          },
          {
            name: "Team Starter (2GB)",
            priceId: process.env.STRIPE_PRICE_TEAM_2GB || "price_team_2gb",
            limits: {
              workspaces: 1,
              ramGb: 2
            }
          },
          {
            name: "Team Pro (4GB)",
            priceId: process.env.STRIPE_PRICE_TEAM_4GB || "price_team_4gb",
            limits: {
              workspaces: 1,
              ramGb: 4
            }
          },
          {
            name: "Team Scale (8GB)",
            priceId: process.env.STRIPE_PRICE_TEAM_8GB || "price_team_8gb",
            limits: {
              workspaces: 1,
              ramGb: 8
            }
          }
        ]
      }
    }),

    // 5. API Keys for server-to-server provisioning automation
    apiKey({
      rateLimit: {
        window: 60,
        max: 120
      }
    }),

    // 6. Security & Session enhancers
    bearer(),
    multiSession(),
    lastLoginMethod()
  ]
});
