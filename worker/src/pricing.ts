import { Hono } from "hono";
import type { Env } from "./auth";
import { rateCentsPerSecond } from "./pricing";

/**
 * Rental pricing: Cloudflare cost + 25% markup.
 * Source: developers.cloudflare.com/containers/platform/pricing/
 *   memory $0.0000025/GiB-s, CPU $0.000020/vCPU-s (active only), disk $0.00000007/GB-s
 *   Workers Paid includes: 25 GiB-h memory, 375 vCPU-min CPU, 200 GB-h disk per month
 * Estimates assume 25% average CPU utilization. Billing: prepaid credits, deducted per second.
 */

export const RENTAL_RATES: Record<string, { perHourCents: number }> = {
  basic:       { perHourCents: 1232 },  // $12.32/mo always-on
  "standard-1": { perHourCents: 4200 },  // $42.00/mo always-on
  "standard-2": { perHourCents: 6756 },  // $67.56/mo always-on
  "standard-3": { perHourCents: 10133 }, // $101.33/mo always-on
};

export function rateCentsPerHour(instanceType: string): number {
  return RENTAL_RATES[instanceType]?.perHourCents ?? RENTAL_RATES.basic.perHourCents;
}

export function rateCentsPerSecond(instanceType: string): number {
  return rateCentsPerHour(instanceType) / 3600;
}
