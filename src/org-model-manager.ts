import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

export interface OrgModelAgreement {
  provider: "openai" | "azure_openai" | "anthropic" | "google";
  authType: "api_key" | "oauth_team" | "service_account";
  apiKey?: string;
  organizationId?: string; // e.g. OpenAI Org ID (org-xxxx)
  projectSlug?: string;
  defaultModels: Array<{ id: string; name: string }>;
  tokenLimits?: {
    monthlyBudgetUsd?: number;
    enforceStrictQuota?: boolean;
  };
}

/**
 * Admin API: Register & Configure Org Model Agreements
 * Stores organization-wide agreements (e.g. OpenAI Enterprise / Team API agreement)
 */
router.post("/agreements", async (req: Request, res: Response) => {
  const { orgId, agreement } = req.body as { orgId: string; agreement: OrgModelAgreement };

  if (!orgId || !agreement || !agreement.provider) {
    return res.status(400).json({ error: "Missing orgId or agreement payload" });
  }

  const orgConfigDir = `/srv/chamberwork/configs/${orgId}/models`;
  fs.mkdirSync(orgConfigDir, { recursive: true });

  const agreementPath = path.join(orgConfigDir, `${agreement.provider}-agreement.json`);
  fs.writeFileSync(agreementPath, JSON.stringify(agreement, null, 2), { mode: 0o400 }); // Read-only

  console.log(`[Org Models] Configured ${agreement.provider} plan for Org: ${orgId}`);

  return res.status(201).json({
    success: true,
    message: `Model agreement for ${agreement.provider} registered successfully`,
    provider: agreement.provider,
  });
});

/**
 * User Login Sync Hook:
 * Automatically called when an employee/user logs in to their Chamberwork account.
 * Materializes their OpenCode & OpenChamber provider credentials so models work instantly.
 */
router.post("/sync-user-credentials", async (req: Request, res: Response) => {
  const { orgId, username, githubLogin } = req.body;

  if (!orgId || !username) {
    return res.status(400).json({ error: "orgId and username are required" });
  }

  const orgConfigDir = `/srv/chamberwork/configs/${orgId}/models`;
  const userOpenCodeDir = `/srv/chamberwork/configs/${username}/opencode`;
  fs.mkdirSync(userOpenCodeDir, { recursive: true });

  // Read all active org agreements
  const agreementFiles = fs.existsSync(orgConfigDir) ? fs.readdirSync(orgConfigDir) : [];
  const providersConfig: Record<string, any> = {};

  for (const file of agreementFiles) {
    if (file.endsWith("-agreement.json")) {
      const agreement: OrgModelAgreement = JSON.parse(
        fs.readFileSync(path.join(orgConfigDir, file), "utf-8")
      );

      // Inject agreement into user's OpenCode environment config
      if (agreement.provider === "openai") {
        providersConfig["openai"] = {
          name: "Company OpenAI Account",
          apiKey: agreement.apiKey,
          organization: agreement.organizationId,
          models: agreement.defaultModels || [
            { id: "gpt-4o", name: "GPT-4o (Org Shared)" },
            { id: "o1", name: "o1 Reasoning (Org Shared)" },
            { id: "o3-mini", name: "o3-mini (Org Fast)" }
          ]
        };
      }
    }
  }

  // Write directly into user's isolated opencode.json config
  const userConfigPath = path.join(userOpenCodeDir, "opencode.json");
  const existingConfig = fs.existsSync(userConfigPath)
    ? JSON.parse(fs.readFileSync(userConfigPath, "utf-8"))
    : {};

  const mergedConfig = {
    ...existingConfig,
    providers: {
      ...(existingConfig.providers || {}),
      ...providersConfig
    },
    // User Git & Identity Binding
    identity: {
      githubUser: githubLogin || username,
      syncedAt: new Date().toISOString()
    }
  };

  fs.writeFileSync(userConfigPath, JSON.stringify(mergedConfig, null, 2), { mode: 0o600 });

  return res.json({
    success: true,
    message: `Synced ${Object.keys(providersConfig).length} organization provider accounts for user ${username}`,
    activeProviders: Object.keys(providersConfig)
  });
});

export default router;
