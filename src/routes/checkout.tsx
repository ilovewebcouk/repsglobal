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

  const tierMeta = TIERS[search.tier];
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
      {/* Slim header */}
      <header className="border-b border-white/[0.06] bg-reps-ink/80 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-[1240px] items-center justify-between px-5">
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

      <main className="mx-auto max-w-[1240px] px-5 py-10 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-14">
          {/* LEFT — order summary / context */}
          <aside className="order-2 lg:order-1">
            <div className="lg:sticky lg:top-24">
              <div className="mb-6 flex items-center gap-2">
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
              <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-white/65">
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
                <ul className="mt-3 space-y-2.5">
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

          {/* RIGHT — Stripe embedded checkout */}
          <section className="order-1 lg:order-2">
            <div className="rounded-[22px] border border-white/10 bg-white/[0.02] p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]">
              {error && (
                <div className="rounded-[18px] border border-red-400/40 bg-red-500/10 p-8 text-red-100">
                  <p className="font-display text-[18px] font-semibold">Checkout couldn't start</p>
                  <p className="mt-2 text-[14px] text-red-100/80">{error}</p>
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
                <div className="flex min-h-[520px] flex-col items-center justify-center rounded-[18px] bg-white/[0.02] p-8 text-center">
                  <Loader2 className="size-6 animate-spin text-reps-orange" aria-hidden />
                  <p className="mt-4 text-[14px] font-medium text-white/80">
                    Preparing secure checkout
                  </p>
                  <p className="mt-1 text-[12.5px] text-white/45">
                    Setting up your encrypted session with Stripe…
                  </p>
                </div>
              )}

              {!error && clientSecret && (
                <div className="overflow-hidden rounded-[18px] bg-white">
                  <EmbeddedCheckoutProvider
                    stripe={getStripeClient()}
                    options={{ clientSecret }}
                  >
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                </div>
              )}
            </div>

            {/* Below-iframe trust footer */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-white/40">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5" aria-hidden />
                Payments secured by Stripe
              </span>
              <span aria-hidden className="size-1 rounded-full bg-white/20" />
              <span>256-bit TLS</span>
              <span aria-hidden className="size-1 rounded-full bg-white/20" />
              <span>PCI DSS Level 1</span>
            </div>

            <p className="mt-6 text-center text-[12px] leading-relaxed text-white/40">
              By continuing you agree to the REPs{" "}
              <Link to="/terms" className="text-white/60 underline-offset-2 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-white/60 underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
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
