// Price IDs for REPS platform billing.
// REPS 3-tier ladder: Verified / Pro / Studio.
// The current "Pro" tier mirrors what was previously sold as "Business" —
// same Stripe price IDs, same Founding lock, same £59/mo · £590/yr pricing.
// Studio is unchanged. Verified is unchanged. The old £29 Pro tier is retired.

export type BillingTier = "verified" | "pro" | "studio";
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
  // Pro reuses the Stripe price IDs previously assigned to the Business tier.
  pro: {
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
