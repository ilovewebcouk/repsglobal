import { useEffect, useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { Check, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { getStripeClient, getStripeEnvironment } from "@/lib/billing/stripe-client";
import { Button } from "@/components/ui/button";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { Badge } from "@/components/ui/badge";
import { getCheckoutOffer, TIERS } from "@/lib/billing";
import { PLANS } from "@/components/pricing/pricing-data";

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

  const tierMeta = TIERS[search.tier as "verified" | "pro"];
  const offer = getCheckoutOffer(search.tier, search.period);
  const plan = PLANS.find((p) => p.tierKey === search.tier)!;
  const priceView = plan.pricing[search.period === "annual" ? "annual" : "monthly"];
  const isPro = search.tier === "pro";
  const isFounding = Boolean(offer?.founding);
  const trialDays = offer?.trialDays ?? 0;

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
    <div className="min-h-screen bg-reps-ink text-white">
      {/* Full-width dark header band */}
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
              onClick={() => navigate({ to: "/pricing" })}
              className="text-[13px] text-white/60 transition hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </header>

      {/* Full-bleed split: dark left, light right, hard vertical seam */}
      <main className="grid min-h-[calc(100vh-60px)] lg:grid-cols-2">
        {/* LEFT — dark summary */}
        <aside className="bg-reps-ink lg:border-r lg:border-white/[0.08]">
          <div className="ml-auto w-full max-w-[560px] px-6 py-10 lg:px-12 lg:py-16">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-reps-orange-border bg-reps-orange-soft text-[11px] font-medium uppercase tracking-[0.12em] text-reps-orange"
              >
                REPs {tierMeta.label}
              </Badge>
              {isFounding && (
                <Badge
                  variant="outline"
                  className="border-emerald-400/30 bg-emerald-500/15 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-300"
                >
                  Founding
                </Badge>
              )}
            </div>

            <h1 className="font-display text-[28px] font-semibold leading-tight text-white lg:text-[34px]">
              You're joining REPs {tierMeta.label}.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-white/65">
              {tierMeta.blurb}
            </p>

            {/* Price block */}
            <div className="mt-7 rounded-[18px] border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    {priceView.was && (
                      <span className="text-[15px] text-white/40 line-through">
                        {priceView.was}
                      </span>
                    )}
                    <span className="font-display text-[32px] font-semibold text-white">
                      {priceView.price}
                    </span>
                    <span className="text-[14px] text-white/55">{priceView.period}</span>
                  </div>
                  {priceView.meta && (
                    <p className="mt-1 text-[12.5px] text-white/45">{priceView.meta}</p>
                  )}
                </div>
                {isFounding && (
                  <div className="flex items-center gap-1 text-[11.5px] font-medium uppercase tracking-[0.1em] text-reps-orange">
                    <Sparkles className="size-3.5" aria-hidden />
                    Locked for life
                  </div>
                )}
              </div>

              {trialDays > 0 && (
                <div className="mt-4 flex items-start gap-2.5 rounded-[12px] border border-emerald-400/25 bg-emerald-500/10 p-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
                  <div className="text-[13px] leading-relaxed text-emerald-100/90">
                    <span className="font-medium text-emerald-100">£0 today.</span> Your {trialDays}-day free trial starts now. Cancel anytime before day {trialDays} and you won't be charged.
                  </div>
                </div>
              )}
            </div>

            {/* What's included */}
            <div className="mt-7">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-white/45">
                What's included
              </h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {plan.features.slice(0, isPro ? 7 : 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-[14px] text-white/80">
                    <Check className="mt-0.5 size-4 shrink-0 text-reps-orange" aria-hidden />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trust strip */}
            <div className="mt-7 grid grid-cols-3 gap-3">
              <TrustTile
                icon={<ShieldCheck className="size-4" />}
                label="Verified register"
                sub="Credentials checked"
              />
              <TrustTile
                icon={<Lock className="size-4" />}
                label="Secure payment"
                sub="PCI DSS Level 1"
              />
              <TrustTile
                icon={<Check className="size-4" />}
                label="Cancel anytime"
                sub="From your dashboard"
              />
            </div>

            {/* Testimonial */}
            <figure className="mt-7 rounded-[18px] border border-white/10 bg-white/[0.02] p-5">
              <blockquote className="text-[14px] leading-relaxed text-white/80">
                "Being on the verified register is what finally separated me from every other PT in the area. Enquiries went from 'cheapest please' to serious clients."
              </blockquote>
              <figcaption className="mt-3 flex items-center gap-2 text-[12.5px] text-white/50">
                <span className="size-[22px] rounded-full bg-gradient-to-br from-reps-orange/60 to-reps-orange/20" aria-hidden />
                James W. · Personal Trainer · London
              </figcaption>
            </figure>
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
                <p className="mt-1 text-[12.5px] text-reps-ink/50">
                  Setting up your encrypted session with Stripe…
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

            {/* Below-iframe trust footer */}
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

            <p className="mt-5 text-[12px] leading-relaxed text-reps-ink/50">
              By continuing you agree to the REPs{" "}
              <Link to="/terms" className="text-reps-ink/80 underline-offset-2 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-reps-ink/80 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function TrustTile({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="rounded-[12px] border border-white/10 bg-white/[0.02] p-3">
      <div className="text-reps-orange">{icon}</div>
      <p className="mt-2 text-[12.5px] font-medium leading-tight text-white">{label}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-white/45">{sub}</p>
    </div>
  );
}
