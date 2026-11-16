import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

/**
 * Admin API: Lock Organization-Wide OpenChamber Policy
 * Writes an immutable policy.json file that users cannot modify
 */
router.post("/policy/lock", async (req: Request, res: Response) => {
  const { organizationId, organizationName, customModels, allowedExtensions, opencodeBinary } = req.body;

  if (!organizationId || !organizationName) {
    return res.status(400).json({ error: "organizationId and organizationName required" });
  }

  const policyConfig = {
    enterpriseMode: true,
    organization: organizationName,
    allowNetworkAccess: true,
    opencodeBinary: opencodeBinary || "/usr/local/bin/opencode",
    hideBuiltinSkillCatalogs: false,
    allowedExtensions: [
      "https://github.com/leoporoluo/openchamber-providers",
      "https://github.com/dietrichgebert/ponytail",
      ...(allowedExtensions || [])
    ],
    // 9Router centralized gateway
    customModelGateway: "http://127.0.0.1:20128/v1",
    customModels: customModels || []
  };

  const orgConfigDir = `/srv/chamberwork/configs/${organizationId}/openchamber`;
  fs.mkdirSync(orgConfigDir, { recursive: true });

  const policyFilePath = path.join(orgConfigDir, "policy.json");
  fs.writeFileSync(policyFilePath, JSON.stringify(policyConfig, null, 2), { mode: 0o400 }); // Read-only

  return res.json({
    success: true,
    message: `Org-wide policy locked for ${organizationName}`,
    policyPath: policyFilePath
  });
});

/**
 * Admin API: Sync Custom Models to OpenChamber Providers
 */
router.post("/models/sync", (req: Request, res: Response) => {
  const { organizationId, models } = req.body;

  // Format model payload for openchamber-providers extension
  const providerPayload = {
    source: "chamberwork-admin",
    updatedAt: new Date().toISOString(),
    providers: {
      "chamberwork-9router": {
        name: "Chamberwork Smart AI Gateway",
        baseURL: "http://127.0.0.1:20128/v1",
        models: models || [
          { id: "cc/claude-opus-4-7", name: "Claude Opus (Auto-Fallback)" },
          { id: "glm/glm-5.1", name: "GLM 5.1 (Economy)" },
          { id: "kr/claude-sonnet-4.5", name: "Claude Sonnet (Free Tier)" }
        ]
      }
    }
  };

  const providerPath = `/srv/chamberwork/configs/${organizationId}/opencode/providers.json`;
  fs.mkdirSync(path.dirname(providerPath), { recursive: true });
  fs.writeFileSync(providerPath, JSON.stringify(providerPayload, null, 2));

  return res.json({ success: true, syncedModels: providerPayload });
});

export default router;
