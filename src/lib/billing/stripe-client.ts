import type { StripeEnv } from "./stripe.server";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function hasStripeClientToken(): boolean {
  return Boolean(clientToken);
}

export function getStripeEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";

  throw new Error(
    "Stripe payments are not configured for this build. Complete Stripe go-live to enable production checkout.",
  );
}
