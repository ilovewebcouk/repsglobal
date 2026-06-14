import { createCheckoutSession } from "./billing.functions";
import { getStripeEnvironment } from "./stripe-client";

type Tier = "verified" | "pro";
type Period = "monthly" | "annual";

/**
 * Calls the server fn to mint a Stripe Hosted Checkout session and
 * redirects the browser to the Stripe URL. Throws on failure so callers
 * can surface a toast / inline error and reset their button state.
 */
export async function startCheckoutRedirect(tier: Tier, period: Period): Promise<void> {
  const result = await createCheckoutSession({
    data: { tier, period, environment: getStripeEnvironment() },
  });
  if ("error" in result) throw new Error(result.error);
  if (!result.url) throw new Error("Stripe did not return a checkout URL");
  window.location.assign(result.url);
}
