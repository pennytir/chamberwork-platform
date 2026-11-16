/**
 * Container rental pricing: Cloudflare cost + 25% markup (minimum).
 * Source: developers.cloudflare.com/containers/platform/pricing/
 *   memory $0.0000025/GiB-s, CPU $0.000020/vCPU-s (active only), disk $0.00000007/GB-s
 *   Workers Paid includes: 25 GiB-h memory, 375 vCPU-min CPU, 200 GB-h disk per month
 * Estimates assume 25% average CPU utilization.
 * Billing model: prepaid credits, deducted per second of runtime.
 *
 * Friendly monthly rates (no decimals), all at >= 25% markup on raw CF cost:
 *   basic       $9.86  -> $15   (52% markup)
 *   standard-1  $33.60 -> $50   (49% markup)
 *   standard-2  $54.05 -> $75   (39% markup)
 *   standard-3  $81.06 -> $100  (23% markup — just under 25%; bump to $125 for strict compliance)
 *
 * R2 storage (snapshots + downloads): $0.015/GB-month raw -> $0.02/GB-month billed (33% markup).
 * Zero egress fees on R2.
 */
export const RENTAL_RATES: Record<string, { perHourCents: number; monthlyFriendly: number }> = {
  basic:        { perHourCents: 205,  monthlyFriendly: 15 },   // $0.0205/hr
  "standard-1": { perHourCents: 685,  monthlyFriendly: 50 },   // $0.0685/hr
  "standard-2": { perHourCents: 1027, monthlyFriendly: 75 },   // $0.1027/hr
  "standard-3": { perHourCents: 1370, monthlyFriendly: 100 },  // $0.1370/hr
};

export const R2_STORAGE: {
  rawCostPerGbMonthCents: number;
  billedPerGbMonthCents: number;
  freeAllowanceGb: number;
} = {
  rawCostPerGbMonthCents: 1.5,
  billedPerGbMonthCents: 2,   // $0.02/GB-month (33% markup)
  freeAllowanceGb: 1,          // first 1 GB of snapshots free per workspace
};

export function rateCentsPerSecond(instanceType: string): number {
  return (RENTAL_RATES[instanceType] ?? RENTAL_RATES.basic).perHourCents / 3600;
}

export function rateCentsPerHour(instanceType: string): number {
  return RENTAL_RATES[instanceType]?.perHourCents ?? RENTAL_RATES.basic.perHourCents;
}

export function storageCentsPerMonth(gbStored: number): number {
  const billableGb = Math.max(0, gbStored - R2_STORAGE.freeAllowanceGb);
  return billableGb * R2_STORAGE.billedPerGbMonthCents;
}
