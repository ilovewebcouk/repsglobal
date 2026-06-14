import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Loader2, Lock, Sparkles, Zap } from "lucide-react";

import { createCreditTopupCheckout } from "@/lib/credits/credits.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const CREDIT_USES = [
  "AI-assisted bio + service copy rewrites",
  "Lead scoring + reply drafts",
  "Profile photo enhancement",
  "Programme + nutrition plan starters",
];

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

      <main className="mx-auto flex w-full max-w-[640px] flex-col px-6 py-12 lg:py-16">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-reps-orange-border bg-reps-orange-soft text-[11px] font-medium uppercase tracking-[0.12em] text-reps-orange"
          >
            AI credits
          </Badge>
          <Badge
            variant="outline"
            className="border-white/15 bg-white/[0.04] text-[11px] font-medium uppercase tracking-[0.12em] text-white/70"
          >
            {pack.label} pack
          </Badge>
        </div>

        <h1 className="font-display text-[28px] font-semibold leading-tight text-white lg:text-[34px]">
          Top up your REPs AI credits.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">
          Credits never expire and stack on top of your monthly Pro allowance.
        </p>

        <div className="mt-8 rounded-[18px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-display text-[32px] font-semibold text-white">
                  £{pack.amountGbp}
                </span>
                <span className="text-[14px] text-white/55">one-off</span>
              </div>
              <p className="mt-1 text-[12.5px] text-white/45">
                {pack.credits.toLocaleString()} credits · added instantly on payment
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.1em] text-reps-orange">
              <Sparkles className="size-3.5" aria-hidden />
              Never expire
            </div>
          </div>

          <ul className="mt-6 flex flex-col gap-2.5 border-t border-white/[0.06] pt-5">
            {CREDIT_USES.map((use) => (
              <li key={use} className="flex items-start gap-2.5 text-[14px] text-white/80">
                <Zap className="mt-0.5 size-4 shrink-0 text-reps-orange" aria-hidden />
                <span>{use}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="mt-6 rounded-[18px] border border-red-400/30 bg-red-500/10 p-4 text-[14px] text-red-100">
            <p className="font-medium">Checkout couldn't start</p>
            <p className="mt-1 text-red-100/80">{error}</p>
          </div>
        )}

        <Button
          type="button"
          size="lg"
          onClick={() => goToStripe.mutate()}
          disabled={isRedirecting}
          className="mt-7 h-[52px] w-full rounded-[10px] bg-reps-orange text-[15px] font-semibold text-white hover:bg-reps-orange/90"
        >
          {isRedirecting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Redirecting to secure payment…
            </>
          ) : (
            <>
              Continue to secure payment
              <ArrowRight className="size-4" aria-hidden />
            </>
          )}
        </Button>

        <p className="mt-4 text-center text-[12.5px] leading-relaxed text-white/45">
          You'll be taken to Stripe to complete payment. Credits hit your wallet instantly after.
        </p>
      </main>
    </div>
  );
}
