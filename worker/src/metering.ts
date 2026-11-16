import { Hono } from "hono";
import type { Env } from "./auth";
import { rateCentsPerSecond } from "./pricing";

/**
 * Usage metering via Workers Analytics Engine.
 * Pricing (Workers Paid): 10M data points/mo included (+$0.25/M),
 * 1M SQL reads/mo included (+$1.00/M). One data point per metered event.
 *
 * Layout:
 *   blobs:   [workspaceId, userId, orgId, instanceType, kind]
 *   doubles: [durationSeconds, billedCents]
 *   index:   [workspaceId]  (filterable in SQL API)
 */

export function writeUsagePoint(
  env: Env,
  s: { workspaceId: string; userId: string; orgId: string | null; instanceType: string; kind: string; durationSeconds: number; billedCents: number }
) {
  env.USAGE.writeDataPoint({
    blobs: [s.workspaceId, s.userId, s.orgId ?? "", s.instanceType, s.kind],
    doubles: [s.durationSeconds, s.billedCents],
    indexes: [s.workspaceId],
  });
}

/** Hourly billing cron: reconcile runtime usage from Analytics Engine, deduct credits, auto-stop broke wallets. */
export async function billingTick(env: Env): Promise<void> {
  const sql = `
    SELECT blob1 AS workspaceId, blob2 AS userId, blob3 AS orgId,
           SUM(double1) AS runtimeSeconds, SUM(double2) AS billedCents
    FROM chamberwork_usage
    WHERE blob5 = 'runtime' AND timestamp > NOW() - INTERVAL '1' HOUR
    GROUP BY blob1, blob2, blob3`;

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/analytics_engine/sql`,
    { method: "POST", headers: { Authorization: `Bearer ${env.CF_API_TOKEN}` }, body: sql }
  );
  const { data } = (await res.json()) as {
    data: Array<{ workspaceId: string; userId: string; orgId: string; runtimeSeconds: number; billedCents: number }>;
  };

  for (const row of data ?? []) {
    const billed = Math.ceil(row.billedCents);

    // Ledger the deduction (D1)
    await env.DB.prepare(
      `INSERT INTO credit_transaction (id, organization_id, user_id, amount_cents, kind, description, analytics_period, created_at)
       VALUES (?, ?, ?, ?, 'usage', 'container runtime', ?, ?)`
    ).bind(crypto.randomUUID(), row.orgId || null, row.userId, -billed, new Date().toISOString().slice(0, 13), Date.now()).run();

    if (row.orgId) {
      await env.DB.prepare(
        "UPDATE organization SET credits_balance_cents = credits_balance_cents - ? WHERE id = ?"
      ).bind(billed, row.orgId).run();
    }

    // Auto power-down when balance <= 0
    const balance = row.orgId
      ? await env.DB.prepare("SELECT credits_balance_cents FROM organization WHERE id = ?").bind(row.orgId).first<{ credits_balance_cents: number }>()
      : { credits_balance_cents: 0 };

    if ((balance?.credits_balance_cents ?? 0) <= 0) {
      const stub = env.WORKSPACE.get(env.WORKSPACE.idFromName(row.workspaceId));
      await stub.fetch(new Request("https://internal/stop", { method: "POST" }));
      console.log(`[billing] workspace ${row.workspaceId} auto-stopped: balance <= 0`);
    }
  }
}
