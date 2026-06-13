import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { getStripeClient, getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";

type CheckoutSearch = {
  tier: "verified" | "pro";
  period: "monthly" | "annual";
};

export const Route = createFileRoute("/checkout")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): CheckoutSearch => {
    const tier =
      search.tier === "verified" || search.tier === "pro" ? search.tier : "pro";
    const period =
      search.period === "monthly" || search.period === "annual"
        ? search.period
        : tier === "verified"
          ? "annual"
          : "monthly";
    return { tier, period };
  },
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({
        to: "/auth",
        search: { tier: search.tier, period: search.period, next: "checkout" } as never,
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Checkout — REPs" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await startCheckout({
          data: {
            tier: search.tier,
            period: search.period,
            environment: getStripeEnvironment(),
          },
        });
        if (cancelled) return;
        if (!result?.clientSecret) {
          throw new Error("Checkout session did not return a client secret.");
        }
        setClientSecret(result.clientSecret);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not start checkout");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search.tier, search.period, startCheckout]);

  return (
    <div className="min-h-screen bg-reps-ink px-4 py-12">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-[22px] font-semibold text-white">
            Complete your purchase
          </h1>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/pricing" })}
            className="text-white/70 hover:text-white"
          >
            Cancel
          </Button>
        </div>

        {error && (
          <div className="rounded-[16px] border border-red-400/40 bg-red-500/10 p-6 text-red-200">
            <p className="font-semibold">Checkout couldn't start</p>
            <p className="mt-1 text-[14px] text-red-200/80">{error}</p>
            <Button
              className="mt-4"
              onClick={() => {
                setError(null);
                setClientSecret(null);
              }}
            >
              Try again
            </Button>
          </div>
        )}

        {!error && !clientSecret && (
          <div className="flex min-h-[400px] items-center justify-center rounded-[16px] border border-white/10 bg-white/[0.02] text-white/60">
            <Loader2 className="mr-2 size-5 animate-spin" />
            Preparing secure checkout…
          </div>
        )}

        {!error && clientSecret && (
          <div className="overflow-hidden rounded-[16px] bg-white">
            <EmbeddedCheckoutProvider
              stripe={getStripeClient()}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}
