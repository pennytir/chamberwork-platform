import { Container, port } from "@cloudflare/containers";

/**
 * One rented CDE workspace = OpenChamber + OpenCode in a Cloudflare Container.
 * - Sleeps after inactivity (scale-to-zero: the billing meter stops with it)
 * - Restores the latest R2 snapshot on boot
 */
export class Workspace extends Container {
  defaultPort = port(3000); // OpenChamber web port inside the container
  sleepAfter = "15m";       // scale to zero: meter stops when asleep

  override onStart() {
    console.log("[workspace] started");
  }

  override onStop() {
    console.log("[workspace] stopped — meter stopped with it");
  }

  override onError(err: unknown) {
    console.error("[workspace] error:", err);
  }

  /** Tar /workspace and stream into R2 as a snapshot. */
  async snapshotTo(r2: R2Bucket, key: string): Promise<void> {
    const stream = this.exec(["tar", "czf", "-", "-C", "/workspace", "."]).stdout;
    await r2.put(key, stream, { httpMetadata: { contentType: "application/gzip" } });
  }

  /** Restore a snapshot from R2 into /workspace before start. */
  async restoreFrom(r2: R2Bucket, key: string): Promise<boolean> {
    const obj = await r2.get(key);
    if (!obj) return false;
    await this.exec(["sh", "-c", "mkdir -p /workspace && tar xzf - -C /workspace"], { stdin: obj.body });
    return true;
  }

  /** Stream the workspace as a tar.gz download to the user's machine. */
  async downloadStream(): Promise<ReadableStream> {
    return this.exec(["tar", "czf", "-", "-C", "/workspace", "."]).stdout;
  }
}
