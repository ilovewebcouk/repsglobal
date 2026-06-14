import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Loader2 } from "lucide-react";

import { createCreditTopupCheckout } from "@/lib/credits/credits.functions";
import { getStripeClient, getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKS, type CreditPackKey } from "@/lib/billing";

type Search = { pack: CreditPackKey };

export const Route = createFileRoute("/_authenticated/_professional/checkout_/credits")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const pack =
      search.pack === "small" || search.pack === "medium" || search.pack === "large"
        ? search.pack
        : "medium";
    return { pack };
  },
  head: () => ({
    meta: [
      { title: "Top up AI credits — REPs" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CreditsCheckoutPage,
});

function CreditsCheckoutPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCreditTopupCheckout);
  const pack = CREDIT_PACKS[search.pack as CreditPackKey];

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await startCheckout({
          data: { pack: search.pack, environment: getStripeEnvironment() },
        });
        if (cancelled) return;
        if (!result?.clientSecret) throw new Error("Checkout session did not return a client secret.");
        setClientSecret(result.clientSecret);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not start checkout");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search.pack, startCheckout]);

  return (
    <div className="min-h-screen bg-reps-ink px-4 py-12">
      <div className="mx-auto max-w-[860px]">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-white">
              Top up AI credits
            </h1>
            <p className="mt-1 text-[13px] text-white/55">
              {pack.label} pack · {pack.credits.toLocaleString()} credits · £{pack.amountGbp}
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/dashboard/settings" })}
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
