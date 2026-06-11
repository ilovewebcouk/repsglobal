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

export function tierForPriceId(priceId: string): TierKey | null {
  for (const t of Object.values(TIERS)) {
    if (t.stripePriceId === priceId) return t.key;
  }
  return null;
}
