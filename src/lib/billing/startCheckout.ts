import { createCheckoutSession } from "./billing.functions";
import { getStripeEnvironment } from "./stripe-client";
import { trackGaEvent, getGaClientId } from "@/hooks/useGoogleAnalytics";

type Tier = "verified" | "pro";
type Period = "monthly" | "annual";

// Client-side price map — kept in sync with CHECKOUT_OFFERS in src/lib/billing.ts.
// Used only for firing the GA4 `begin_checkout` event; the source of truth for
// what the user is actually charged is the Stripe price resolved server-side.
const GA_PRICES: Record<Tier, Record<Period, number>> = {
  verified: { annual: 34, monthly: 0 },
  pro: { monthly: 59, annual: 590 },
};

/**
 * Calls the server fn to mint a Stripe Hosted Checkout session and
 * redirects the browser to the Stripe URL. Throws on failure so callers
 * can surface a toast / inline error and reset their button state.
 */
export async function startCheckoutRedirect(tier: Tier, period: Period): Promise<void> {
  const gaClientId = getGaClientId();

  // GA4 ecommerce: begin_checkout — fired before the redirect to Stripe so it
  // lands in the same session as the pageviews that led up to it.
  const value = GA_PRICES[tier]?.[period] ?? 0;
  trackGaEvent("begin_checkout", {
    currency: "GBP",
    value,
    items: [
      {
        item_id: `${tier}_${period}`,
        item_name: tier === "pro" ? "REPS Pro" : "REPS Core",
        item_category: tier,
        item_variant: period,
        price: value,
        quantity: 1,
      },
    ],
  });

  const result = await createCheckoutSession({
    data: { tier, period, environment: getStripeEnvironment(), gaClientId },
  });
  if ("error" in result) throw new Error(result.error);
  if (!result.url) throw new Error("Stripe did not return a checkout URL");
  window.location.assign(result.url);
}
