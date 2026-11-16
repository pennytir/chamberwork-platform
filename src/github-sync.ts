import express, { Request, Response } from "express";
import crypto from "crypto";

const router = express.Router();

/**
 * Handles Inbound Webhooks from the Customer's GitHub App Installation
 * Subscribed events: organization, membership, team, repository
 */
router.post("/webhook", async (req: Request, res: Response) => {
  const signature = req.header("X-Hub-Signature-256");
  const event = req.header("X-GitHub-Event");
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET || "github_webhook_secret_placeholder";

  // 1. Verify cryptographic HMAC signature
  const hmac = crypto.createHmac("sha256", webhookSecret);
  const digest = `sha256=${hmac.update(JSON.stringify(req.body)).digest("hex")}`;
  if (!signature || signature !== digest) {
    return res.status(401).json({ error: "Invalid GitHub webhook signature" });
  }

  const { action, sender, organization, installation } = req.body;

  // 2. Prevent Infinite Sync Loops: Echo suppression & Actor Filtering
  // Ignore mutations originated by our own SaaS installation bot
  if (sender && sender.type === "Bot" && sender.login.includes("chamberwork")) {
    return res.status(200).json({ ignored: true, reason: "Self-mutation suppressed" });
  }

  console.log(`[GitHub Inbound] Event: ${event} | Action: ${action} | Org: ${organization?.login}`);

  switch (event) {
    case "installation":
      if (action === "created") {
        console.log(`[GitHub App] New Org Installation: ${organization?.login} (ID: ${installation?.id})`);
        // Trigger background initial hydration: GET /orgs/{org}/members & /orgs/{org}/teams
      }
      break;

    case "organization":
      if (action === "member_added") {
        console.log(`[GitHub Org] Added member: ${req.body.membership?.user?.login}`);
      }
      break;

    case "team":
      console.log(`[GitHub Team] Team ${action}: ${req.body.team?.name}`);
      break;

    case "repository":
      console.log(`[GitHub Repo] Repo ${action}: ${req.body.repository?.full_name}`);
      break;
  }

  return res.status(200).json({ status: "acknowledged" });
});

export default router;
