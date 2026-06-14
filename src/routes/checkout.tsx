import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Check, Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { getStripeEnvironment } from "@/lib/billing/stripe-client";
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

  const tierMeta = TIERS[search.tier as "verified" | "pro"];
  const offer = getCheckoutOffer(search.tier, search.period);
  const plan = PLANS.find((p) => p.tierKey === search.tier)!;
  const priceView = plan.pricing[search.period === "annual" ? "annual" : "monthly"];
  const isPro = search.tier === "pro";
  const isFounding = Boolean(offer?.founding);
  const trialDays = offer?.trialDays ?? 0;

  const goToStripe = useMutation({
    mutationFn: async () => {
      const result = await startCheckout({
        data: {
          tier: search.tier,
          period: search.period,
          environment: getStripeEnvironment(),
        },
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
              onClick={() => navigate({ to: "/pricing" })}
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

        {/* Order summary */}
        <div className="mt-8 rounded-[18px] border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                {priceView.was && (
                  <span className="text-[15px] text-white/40 line-through">{priceView.was}</span>
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
            <div className="mt-5 flex items-start gap-2.5 rounded-[12px] border border-emerald-400/25 bg-emerald-500/10 p-3">
              <Check className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden />
              <div className="text-[13px] leading-relaxed text-emerald-100/90">
                <span className="font-medium text-emerald-100">£0 today.</span> Your {trialDays}-day
                free trial starts now. Cancel anytime before day {trialDays} and you won't be charged.
              </div>
            </div>
          )}

          <ul className="mt-6 flex flex-col gap-2.5 border-t border-white/[0.06] pt-5">
            {plan.features.slice(0, isPro ? 6 : 5).map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-[14px] text-white/80">
                <Check className="mt-0.5 size-4 shrink-0 text-reps-orange" aria-hidden />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
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
          You'll be taken to Stripe to complete payment. Your card details never touch REPs servers.
        </p>

        {/* Trust strip */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <TrustTile
            icon={<ShieldCheck className="size-4" />}
            label="Verified register"
            sub="Credentials checked"
          />
          <TrustTile
            icon={<Lock className="size-4" />}
            label="Secured by Stripe"
            sub="PCI DSS Level 1"
          />
          <TrustTile
            icon={<Check className="size-4" />}
            label="Cancel anytime"
            sub="From your dashboard"
          />
        </div>

        <p className="mt-8 text-center text-[12px] leading-relaxed text-white/45">
          By continuing you agree to the REPs{" "}
          <Link to="/terms" className="text-white/70 underline-offset-2 hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="text-white/70 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
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
