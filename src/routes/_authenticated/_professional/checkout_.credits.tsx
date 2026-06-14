import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Check, Loader2, Lock, Sparkles, Zap } from "lucide-react";

import { createCreditTopupCheckout } from "@/lib/credits/credits.functions";
import { getStripeClient, getStripeEnvironment } from "@/lib/billing/stripe-client";
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

      <main className="grid min-h-[calc(100vh-60px)] lg:grid-cols-2">
        {/* LEFT — dark summary */}
        <aside className="bg-reps-ink lg:border-r lg:border-white/[0.08]">
          <div className="ml-auto w-full max-w-[560px] px-6 py-10 lg:px-12 lg:py-16">
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

            <div className="mt-7 rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
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
            </div>

            <div className="mt-7">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
                What credits unlock
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {CREDIT_USES.map((use) => (
                  <li key={use} className="flex items-start gap-2.5 text-[14px] text-white/80">
                    <Zap className="mt-0.5 size-4 shrink-0 text-reps-orange" aria-hidden />
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* RIGHT — light payment surface */}
        <section className="bg-[#FAFAF7] text-reps-ink">
          <div className="mr-auto w-full max-w-[560px] px-6 py-10 lg:px-12 lg:py-16">
            <div className="mb-6">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-reps-ink/50">
                Payment
              </p>
              <h2 className="mt-1 font-display text-[22px] font-semibold leading-tight text-reps-ink lg:text-[26px]">
                Enter your details
              </h2>
              <p className="mt-1.5 text-[13.5px] text-reps-ink/60">
                Powered by Stripe. Your card details never touch REPs servers.
              </p>
            </div>

            {error && (
              <div className="rounded-[18px] border border-red-200 bg-red-50 p-6 text-red-900">
                <p className="font-display text-[18px] font-semibold">Checkout couldn't start</p>
                <p className="mt-2 text-[14px] text-red-900/80">{error}</p>
                <Button
                  className="mt-5"
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
              <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[18px] border border-reps-ink/10 bg-white p-8 text-center">
                <Loader2 className="size-6 animate-spin text-reps-orange" aria-hidden />
                <p className="mt-4 text-[14px] font-medium text-reps-ink/80">
                  Preparing secure checkout
                </p>
              </div>
            )}

            {!error && clientSecret && (
              <div>
                <EmbeddedCheckoutProvider
                  stripe={getStripeClient()}
                  options={{ clientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-reps-ink/50">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5" aria-hidden />
                Secured by Stripe
              </span>
              <span aria-hidden className="size-1 rounded-full bg-reps-ink/25" />
              <span>256-bit TLS</span>
              <span aria-hidden className="size-1 rounded-full bg-reps-ink/25" />
              <span>PCI DSS Level 1</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
