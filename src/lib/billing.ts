/**
 * REPS billing config — Phase 2.0
 *
 * Single source of truth for Stripe price IDs and tier metadata.
 * Used by checkout edge function + onboarding UI.
 *
 * Verified  £99/yr  — public verified profile + credential check
 * Pro       £59/mo  (Founding pricing — locked for life for early sign-ups)
 * Studio    Coming soon (multi-seat / facility tier)
 */

export type TierKey = "verified" | "pro" | "studio";
export type PurchasableTier = "verified" | "pro";
export type BillingPeriod = "monthly" | "annual";

export interface TierConfig {
  key: TierKey;
  label: string;
  priceLabel: string;
  intervalLabel: string;
  stripePriceId: string | null; // null = not live yet
  stripeProductId: string | null;
  isFounding?: boolean;
  comingSoon?: boolean;
  blurb: string;
}

export const TIERS: Record<TierKey, TierConfig> = {
  verified: {
    key: "verified",
    label: "Verified",
    priceLabel: "£99",
    intervalLabel: "per year",
    stripePriceId: "price_1Th5cVAP31Yc4cJjRclKEfCH",
    stripeProductId: "prod_UgSXqMrfMGNrKW",
    blurb:
      "Public verified profile, credential check, listing on the global register.",
  },
  pro: {
    key: "pro",
    label: "Pro",
    priceLabel: "£59",
    intervalLabel: "per month — Founding",
    stripePriceId: "price_1Th5cVAP31Yc4cJj4VPiaXeH",
    stripeProductId: "prod_UgSXQ2CckI9BzA",
    isFounding: true,
    blurb:
      "Everything in Verified plus shop-front, bookings, payments, client records, growth and operations tooling.",
  },
  studio: {
    key: "studio",
    label: "Studio",
    priceLabel: "£149",
    intervalLabel: "per month",
    stripePriceId: null,
    stripeProductId: null,
    comingSoon: true,
    blurb: "Multi-seat tier for facilities and teams. Joining the waitlist now.",
  },
};

export type CheckoutOffer = {
  period: BillingPeriod;
  priceId: string;
  display: string;
  trialDays: number;
  founding: boolean;
};

export const CHECKOUT_OFFERS: Record<PurchasableTier, Partial<Record<BillingPeriod, CheckoutOffer>>> = {
  verified: {
    annual: {
      period: "annual",
      priceId: TIERS.verified.stripePriceId as string,
      display: "£99/yr",
      trialDays: 0,
      founding: false,
    },
  },
  pro: {
    monthly: {
      period: "monthly",
      priceId: TIERS.pro.stripePriceId as string,
      display: "£59/mo (Founding)",
      trialDays: 30,
      founding: true,
    },
    annual: {
      period: "annual",
      priceId: "price_1Th8U8AP31Yc4cJjLhq9Yhvf",
      display: "£590/yr (Founding)",
      trialDays: 30,
      founding: true,
    },
  },
};

export function getCheckoutOffer(tier: PurchasableTier, period: BillingPeriod) {
  return CHECKOUT_OFFERS[tier][period] ?? null;
}

export function tierForPriceId(priceId: string): TierKey | null {
  for (const t of Object.values(TIERS)) {
    if (t.stripePriceId === priceId) return t.key;
  }
  return null;
}

export function checkoutOfferForPriceId(priceId: string) {
  for (const [tier, offers] of Object.entries(CHECKOUT_OFFERS)) {
    for (const offer of Object.values(offers)) {
      if (offer?.priceId === priceId) {
        return { tier: tier as PurchasableTier, period: offer.period, founding: offer.founding };
      }
    }
  }
  return null;
}
