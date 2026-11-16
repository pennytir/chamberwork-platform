import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";
import tokenRotationRouter, { verifyGatewaySecret } from "./token-rotation";
import policyRouter from "./policy-manager";
import githubSyncRouter from "./github-sync";
import orgModelRouter from "./org-model-manager";
import { defaultTokenSaverConfig, TokenSaverOptions, buildTokenSaverPromptInstructions } from "./token-saver-settings";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

// 1. Better-Auth Handler (OAuth 2.1, Sentinel, Dash, Stripe, OIDC)
app.all("/api/auth/*", toNodeHandler(auth));

// 2. Gateway Security: Worker token rotation (6-hour rolling cycle)
app.use("/api/internal", tokenRotationRouter);

// 3. GitHub App Inbound & Outbound Webhooks / Sync
app.use("/api/github", githubSyncRouter);

// 4. Organization Model Agreements (OmniRoute-style direct provider sync)
app.use("/api/org/models", orgModelRouter);

// 5. Token Optimization Settings API (RTK, Caveman, Ponytail)
app.get("/api/settings/token-saver", (req, res) => {
  res.json({ config: defaultTokenSaverConfig });
});

app.post("/api/settings/token-saver", (req, res) => {
  const newConfig = req.body as TokenSaverOptions;
  const promptInjection = buildTokenSaverPromptInstructions(newConfig);
  res.json({ success: true, promptInjection });
});

// 6. Protected Admin Endpoints (Requires Gateway Secret verification)
app.use("/api/admin", verifyGatewaySecret);
app.use("/api/admin", policyRouter);

// Tenant Heartbeat
app.post("/api/tenant/heartbeat", (req, res) => {
  const { workspace, timestamp } = req.body;
  return res.json({ status: "acknowledged", workspace, timestamp: Date.now() });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    version: "1.0.0",
    engine: "better-auth + opencode",
    features: ["org-model-sync", "rtk", "caveman", "ponytail"]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Chamberwork Core Control Plane running on http://127.0.0.1:${PORT}`);
});
