import { Hono } from "hono";
import type { Env } from "./auth";
import { Workspace } from "./workspace";
import { writeUsagePoint } from "./metering";
import { rateCentsPerSecond } from "./pricing";

/**
 * Workspace lifecycle routes: rent (start), stop, snapshot, download.
 * Each workspace = one Cloudflare Container (Durable Object) per user.
 */
export const workspaceRoutes = new Hono<{ Bindings: Env }>();

function stub(env: Env, workspaceId: string) {
  return env.WORKSPACE.get(env.WORKSPACE.idFromName(workspaceId));
}

// Rent: start (or resume from snapshot) a container
workspaceRoutes.post("/:id/start", async (c) => {
  const { id } = c.req.param();
  const row = await c.env.DB.prepare("SELECT * FROM workspace WHERE id = ?").bind(id).first<any>();
  if (!row) return c.json({ error: "workspace not found" }, 404);

  // Credit check before spinning up
  const balance = row.organization_id
    ? await c.env.DB.prepare("SELECT credits_balance_cents FROM organization WHERE id = ?").bind(row.organization_id).first<{ credits_balance_cents: number }>()
    : { credits_balance_cents: 0 };
  if ((balance?.credits_balance_cents ?? 0) <= 0) {
    return c.json({ error: "insufficient credits — top up to start your workspace" }, 402);
  }

  const ws = stub(c.env, id) as unknown as Workspace;
  // Restore latest snapshot if the container is cold
  if (row.snapshot_key) {
    await ws.restoreFrom(c.env.SNAPSHOTS, row.snapshot_key);
  }
  await ws.start();

  await c.env.DB.prepare("UPDATE workspace SET state = 'running', updated_at = ? WHERE id = ?").bind(Date.now(), id).run();
  return c.json({ ok: true, state: "running" });
});

// Power down: snapshot + stop (meter stops with it)
workspaceRoutes.post("/:id/stop", async (c) => {
  const { id } = c.req.param();
  const ws = stub(c.env, id) as unknown as Workspace;

  const key = `snapshots/${id}/${Date.now()}.tar.gz`;
  await ws.snapshotTo(c.env.SNAPSHOTS, key);
  await ws.stop();

  await c.env.DB.prepare("UPDATE workspace SET state = 'stopped', snapshot_key = ?, updated_at = ? WHERE id = ?")
    .bind(key, Date.now(), id).run();
  return c.json({ ok: true, snapshotKey: key });
});

// Download environment to local machine (tar.gz stream)
workspaceRoutes.get("/:id/download", async (c) => {
  const { id } = c.req.param();
  const ws = stub(c.env, id) as unknown as Workspace;
  const stream = await ws.downloadStream();
  return new Response(stream, {
    headers: {
      "Content-Type": "application/gzip",
      "Content-Disposition": `attachment; filename="chamberwork-${id}.tar.gz"`,
    },
  });
});

// Restore from a specific snapshot
workspaceRoutes.post("/:id/restore", async (c) => {
  const { id } = c.req.param();
  const { snapshotKey } = await c.req.json<{ snapshotKey: string }>();
  const ws = stub(c.env, id) as unknown as Workspace;
  const ok = await ws.restoreFrom(c.env.SNAPSHOTS, snapshotKey);
  return c.json({ ok, restored: ok ? snapshotKey : null });
}, (c) => c.env);

// Proxy to the running container (metered per request)
workspaceRoutes.all("/:id/proxy/*", async (c) => {
  const { id } = c.req.param();
  const ws = stub(c.env, id) as unknown as Workspace;

  const start = Date.now();
  const res = await ws.fetch(c.req.raw);
  const durationSeconds = (Date.now() - start) / 1000;

  const row = await c.env.DB.prepare("SELECT * FROM workspace WHERE id = ?").bind(id).first<any>();
  if (row) {
    writeUsagePoint(c.env, {
      workspaceId: id,
      userId: row.user_id,
      orgId: row.organization_id,
      instanceType: row.instance_type,
      kind: "request",
      durationSeconds,
      billedCents: durationSeconds * rateCentsPerSecond(row.instance_type),
    });
  }
  return res;
});

export function stub(env: Env, workspaceId: string) {
  return env.WORKSPACE.get(env.WORKSPACE.idFromName(workspaceId));
}
