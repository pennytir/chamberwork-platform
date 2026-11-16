-- Chamberwork D1 schema (Better-Auth core + platform tables)
-- Apply with: npx @better-auth/cli generate --output schema.sql  (then adjust)
-- Or: wrangler d1 execute chamberwork --file=./schema.sql

-- ===== Better-Auth core tables (D1 / sqlite dialect) =====
CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  role TEXT DEFAULT 'user',              -- admin plugin: 'user' | 'admin'
  banned INTEGER DEFAULT 0,
  ban_reason TEXT,
  ban_expires INTEGER,
  -- chamberwork additions
  github_login TEXT,
  stripe_customer_id TEXT
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  impersonated_by TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,              -- provider account id (github user id)
  provider_id TEXT NOT NULL,             -- 'github', 'credential', 'stripe'
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- ===== Organization plugin (team workspaces) =====
CREATE TABLE IF NOT EXISTS "organization" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,             -- <slug>.chamberwork.space
  logo TEXT,
  created_at INTEGER NOT NULL,
  metadata TEXT,

  -- chamberwork additions
  plan TEXT DEFAULT 'solo',              -- solo | team_starter | team_pro | team_scale
  instance_type TEXT DEFAULT 'basic',    -- containers instance type
  stripe_subscription_id TEXT,
  credits_balance_cents INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "member" (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',   -- owner | admin | member
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitation" (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES "organization"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at INTEGER NOT NULL,
  inviter_id TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- ===== Credit wallet (top-up model, no subscriptions) =====
CREATE TABLE IF NOT EXISTS "credit_transaction" (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES "organization"(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,          -- positive = top-up, negative = usage
  kind TEXT NOT NULL,                     -- 'topup' | 'usage' | 'refund' | 'adjustment'
  description TEXT,
  stripe_payment_intent TEXT,             -- for top-ups
  analytics_period TEXT,                  -- e.g. '2026-11-16T10:00' for usage batches
  created_at INTEGER NOT NULL
);

-- ===== Container workspace registry =====
CREATE TABLE IF NOT EXISTS "workspace" (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES "organization"(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,                     -- github username slug
  instance_type TEXT NOT NULL DEFAULT 'basic',
  state TEXT NOT NULL DEFAULT 'stopped',  -- stopped | running | snapshotting
  snapshot_key TEXT,                      -- R2 object key of latest snapshot
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, slug)
);

-- ===== OAuth 2.1 provider tables (tenant VPS SSO clients) =====
CREATE TABLE IF NOT EXISTS "oauth_client" (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret TEXT NOT NULL,
  name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,            -- JSON array
  resource TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_session_token ON "session"(token);
CREATE INDEX IF NOT EXISTS idx_member_org ON "member"(organization_id);
CREATE INDEX IF NOT EXISTS idx_tx_org ON "credit_transaction"(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_user ON "workspace"(user_id);
