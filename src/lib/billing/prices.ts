// Price IDs for REPs platform billing (Phase 1).
// Pro and Business use FOUNDING prices — locked-for-life pricing for early members.
// Standard (post-launch) prices for Pro/Business will be added later when founding closes.

export type BillingTier = "verified" | "pro" | "business" | "studio";
export type BillingPeriod = "monthly" | "annual";

export type PriceEntry = {
  priceId: string;
  amountPence: number;
  founding: boolean;
  display: string;
};

export const PRICES: Record<BillingTier, Record<BillingPeriod, PriceEntry>> = {
  verified: {
    monthly: { priceId: "price_1TdV6TAP31Yc4cJjEb6A132P", amountPence: 1200, founding: false, display: "£12/mo" },
    annual: { priceId: "price_1TdV6YAP31Yc4cJjmHWXm2rW", amountPence: 9900, founding: false, display: "£99/yr" },
  },
  pro: {
    monthly: { priceId: "price_1TdV6ZAP31Yc4cJj9ljfT0ip", amountPence: 2900, founding: true, display: "£29/mo (Founding)" },
    annual: { priceId: "price_1TdV6bAP31Yc4cJjwwoUmzmW", amountPence: 29000, founding: true, display: "£290/yr (Founding)" },
  },
  business: {
    monthly: { priceId: "price_1TdV6cAP31Yc4cJjgGZ8bzTX", amountPence: 5900, founding: true, display: "£59/mo (Founding)" },
    annual: { priceId: "price_1TdV6dAP31Yc4cJjXlLH0Q92", amountPence: 59000, founding: true, display: "£590/yr (Founding)" },
  },
  studio: {
    monthly: { priceId: "price_1TdV6eAP31Yc4cJjXlLH0Q92", amountPence: 14900, founding: false, display: "£149/mo" },
    annual: { priceId: "price_1TdV6fAP31Yc4cJjUoZiv1Q9", amountPence: 149000, founding: false, display: "£1,490/yr" },
  },
};

export function lookupTierByPriceId(priceId: string): { tier: BillingTier; period: BillingPeriod; founding: boolean } | null {
  for (const tier of Object.keys(PRICES) as BillingTier[]) {
    for (const period of ["monthly", "annual"] as BillingPeriod[]) {
      if (PRICES[tier][period].priceId === priceId) {
        return { tier, period, founding: PRICES[tier][period].founding };
      }
    }
  }
  return null;
}
