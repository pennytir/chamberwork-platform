/**
 * Cloudflare Worker: Chamberwork Edge Gateway & UI Router
 * 
 * - Serves Material UI (MUI) Single Page Application
 * - Proxies authenticated API requests to the 8GB VPS Control Plane
 * - Holds VPS_API_SECRET internally (never exposed to browser)
 * - Automatically rolls auth tokens every 6 hours via Scheduled Cron Triggers
 */

export interface Env {
  VPS_API_URL: string;         // e.g. "https://api-internal.chamberwork.space"
  AUTH_KV: KVNamespace;        // Stores active rolling secrets
  VPS_ROOT_SECRET: string;     // Master seed key (set via wrangler secret put)
}

export default {
  // 1. HTTP Request Handler
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // API proxy route to the VPS
    if (url.pathname.startsWith("/api/")) {
      return handleApiProxy(request, env);
    }

    // Static UI / Dashboard Assets
    return new Response(renderMuiAppHtml(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },

  // 2. Cron Trigger Handler: Runs every 6 hours ("0 */6 * * *")
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const newRollingToken = await generateRollingToken(env.VPS_ROOT_SECRET);
    
    // Store token in Cloudflare KV with a 7-hour TTL (1-hour grace overlap)
    await env.AUTH_KV.put("CURRENT_ROLLING_TOKEN", newRollingToken, {
      expirationTtl: 25200 // 7 hours
    });

    // Notify the VPS Control Plane to accept the new token
    await fetch(`${env.VPS_API_URL}/api/internal/roll-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": env.VPS_ROOT_SECRET,
      },
      body: JSON.stringify({ token: newRollingToken, timestamp: Date.now() }),
    });

    console.log("Successfully rolled VPS authentication token (6-hour cycle).");
  },
};

/**
 * Proxies API requests to the VPS control plane, attaching the rolling secret
 */
async function handleApiProxy(request: Request, env: Env): Promise<Response> {
  const currentToken = await env.AUTH_KV.get("CURRENT_ROLLING_TOKEN") || env.VPS_ROOT_SECRET;
  const targetUrl = new URL(request.url);
  const vpsUrl = `${env.VPS_API_URL}${targetUrl.pathname}${targetUrl.search}`;

  const forwardHeaders = new Headers(request.headers);
  forwardHeaders.set("X-Chamberwork-Gateway-Secret", currentToken);
  forwardHeaders.set("X-Forwarded-Host", targetUrl.hostname);

  return fetch(vpsUrl, {
    method: request.method,
    headers: forwardHeaders,
    body: request.body,
  });
}

/**
 * Computes HMAC-SHA256 rolling token based on current 6-hour timestamp block
 */
async function generateRollingToken(secret: string): Promise<string> {
  const epochBlock = Math.floor(Date.now() / (1000 * 60 * 60 * 6)); // Changes every 6h
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(`block-${epochBlock}`));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function renderMuiAppHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chamberwork Cloud Development Environments</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" />
</head>
<body style="margin: 0; background-color: #0f172a;">
  <div id="root"></div>
  <script type="module" src="/assets/main.js"></script>
</body>
</html>`;
}
