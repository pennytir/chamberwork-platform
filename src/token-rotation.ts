import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const router = express.Router();

let currentRollingToken: string = process.env.VPS_ROOT_SECRET || "chamberwork-root-seed-key";
let previousRollingToken: string = "";

/**
 * Middleware: Verify that inbound requests come from Cloudflare Worker with a valid rolling token
 */
export function verifyGatewaySecret(req: Request, res: Response, next: NextFunction) {
  const incomingSecret = req.header("X-Chamberwork-Gateway-Secret");

  if (!incomingSecret) {
    return res.status(401).json({ error: "Missing gateway authentication header" });
  }

  // Accept current rolling token or previous token (for smooth rolling window)
  const isValid = incomingSecret === currentRollingToken || incomingSecret === previousRollingToken;

  if (!isValid) {
    return res.status(403).json({ error: "Invalid or expired gateway rolling token" });
  }

  next();
}

/**
 * Endpoint called exclusively by the Cloudflare Worker Cron Trigger every 6 hours
 */
router.post("/roll-token", (req: Request, res: Response) => {
  const masterKey = req.header("X-Master-Key");
  const expectedMasterKey = process.env.VPS_ROOT_SECRET || "chamberwork-root-seed-key";

  if (!masterKey || masterKey !== expectedMasterKey) {
    return res.status(401).json({ error: "Unauthorized token rotation attempt" });
  }

  const { token } = req.body;
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Invalid token payload" });
  }

  // Graceful rollover
  previousRollingToken = currentRollingToken;
  currentRollingToken = token;

  console.log(`[Token Rotation] Accepted new rolling gateway token at ${new Date().toISOString()}`);
  return res.json({ success: true, rotatedAt: new Date().toISOString() });
});

export default router;
