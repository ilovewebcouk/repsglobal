import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";

import { createCreditTopupCheckout } from "@/lib/credits/credits.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
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

  const goToStripe = useMutation({
    mutationFn: async () => {
      const result = await startCheckout({
        data: { pack: search.pack, environment: getStripeEnvironment() },
      });
      if ("error" in result) throw new Error(result.error);
      return result.url;
    },
    onSuccess: (url) => {
      window.location.assign(url);
    },
  });

  useEffect(() => {
    if (!goToStripe.isIdle) return;
    goToStripe.mutate();
  }, [goToStripe]);

  const isRedirecting = goToStripe.isPending || goToStripe.isSuccess;
  const error = goToStripe.error ? (goToStripe.error as Error).message : null;

  return (
    <div className="min-h-screen bg-reps-ink text-white">
      <header className="border-b border-white/[0.06] bg-reps-ink">
        <div className="mx-auto flex h-[60px] max-w-[1320px] items-center justify-between px-6 lg:px-10">
          <Link to="/" className="flex items-center text-white/90 transition hover:text-white">
            <RepsWordmark className="h-[18px]" />
          </Link>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-1.5 text-[12.5px] text-white/55 sm:flex">
              <Lock className="size-3.5" aria-hidden />
              Secure checkout
            </span>
            <button
              type="button"
              onClick={() => navigate({ to: "/dashboard/settings" })}
              className="text-[13px] text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-60px)] w-full max-w-[640px] flex-col items-center justify-center px-6 py-12 text-center lg:py-16">
        {error && (
          <div className="w-full max-w-[520px] rounded-[18px] border border-red-400/30 bg-red-500/10 p-4 text-[14px] text-red-100">
            <p className="font-medium">Checkout couldn't start</p>
            <p className="mt-1 text-red-100/80">{error}</p>
            <Button
              type="button"
              size="lg"
              onClick={() => goToStripe.mutate()}
              className="mt-5 h-[52px] w-full rounded-[10px] bg-reps-orange text-[15px] font-semibold text-white hover:bg-reps-orange/90"
            >
              Try again
            </Button>
          </div>
        )}

        {!error && (
          <>
            <Loader2 className="size-8 animate-spin text-reps-orange" aria-hidden />
            <h1 className="mt-5 font-display text-[28px] font-semibold leading-tight text-white lg:text-[34px]">
              Redirecting to secure payment…
            </h1>
            <p className="mt-3 max-w-[460px] text-[15px] leading-relaxed text-white/65">
              Preparing your {pack.label.toLowerCase()} credit pack and sending you to Stripe now.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
