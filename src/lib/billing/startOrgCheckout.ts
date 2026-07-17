import { createOrgCheckoutSession } from "./org-checkout.functions";
import { getStripeEnvironment } from "./stripe-client";
import { trackGaEvent, getGaClientId } from "@/hooks/useGoogleAnalytics";
import { ORG_TIERS } from "@/lib/billing";

/**
 * Mints a Stripe Hosted Checkout session for the REPs Training Provider
 * Membership annual subscription and redirects the browser. Requires an
 * authenticated session (createOrgCheckoutSession is guarded by requireSupabaseAuth).
 */
export async function startOrgCheckoutRedirect(): Promise<void> {
  const gaClientId = getGaClientId();
  const tier = ORG_TIERS.training_provider;

  trackGaEvent("begin_checkout", {
    currency: "GBP",
    value: tier.amountPence / 100,
    items: [
      {
        item_id: "training_provider_annual",
        item_name: "REPs Training Provider Membership",
        item_category: "training_provider",
        item_variant: "annual",
        price: tier.amountPence / 100,
        quantity: 1,
      },
    ],
  });

  const result = await createOrgCheckoutSession({
    data: { environment: getStripeEnvironment(), gaClientId },
  });
  if ("error" in result) throw new Error(result.error);
  if (!result.url) throw new Error("Stripe did not return a checkout URL");
  window.location.assign(result.url);
}
