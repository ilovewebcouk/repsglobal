import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RepsWordmark } from "@/components/brand/RepsWordmark";
import { TIERS } from "@/lib/billing";
import { createCheckoutSession } from "@/lib/billing/billing.functions";

type StartSearch = {
  tier?: "verified" | "pro";
  period?: "monthly" | "annual";
};

export const Route = createFileRoute("/_authenticated/_professional/dashboard_/start")({
  validateSearch: (s: Record<string, unknown>): StartSearch => ({
    tier: s.tier === "verified" || s.tier === "pro" ? s.tier : undefined,
    period: s.tier === "pro" ? "monthly" : "annual",
  }),
  head: () => ({
    meta: [{ title: "Choose your plan — REPS" }],
  }),
  component: StartPage,
});

function StartPage() {
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const beginCheckout = async (
    tier: "verified" | "pro",
    period: "monthly" | "annual",
  ) => {
    setError(null);
    setLoadingTier(tier);
    try {
      const result = await startCheckout({ data: { tier, period } });
      if (result?.url) {
        window.location.href = result.url;
        return;
      }
      throw new Error("Checkout session could not be created");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout");
      setLoadingTier(null);
    }
  };

  // If the user already arrived here with a tier+period, kick checkout immediately.
  // (deferred — keep manual choice so they can change their mind)

  return (
    <div className="min-h-screen bg-reps-ink text-reps-text">
      <header className="border-b border-reps-border/40">
        <div className="mx-auto flex h-[72px] max-w-[1240px] items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-3">
            <RepsWordmark className="h-[24px] text-white" />
          </Link>
          <Link to="/dashboard" className="text-sm text-white/60 hover:text-white">
            Skip for now
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-16">
        <div className="mb-12 text-center">
          <Badge className="mb-4 border-reps-orange/40 bg-reps-orange/10 text-reps-orange">
            <Sparkles className="size-3.5" /> Welcome to REPS
          </Badge>
          <h1 className="font-display text-[36px] leading-[1.05] text-white lg:text-[44px]">
            Choose your plan
          </h1>
          <p className="mx-auto mt-4 max-w-[560px] text-[15px] text-white/70">
            Pick the tier that fits where you are today. You can upgrade
            anytime — and everything in your tier is included, no paid add-ons.
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-8 max-w-[640px] rounded-[12px] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {(["verified", "pro"] as const).map((key) => {
            const tier = TIERS[key];
            const recommended = key === "pro";
            const period = key === "verified" ? "annual" : "monthly";
            return (
              <Card
                key={key}
                className={`relative rounded-[18px] border ${
                  recommended
                    ? "border-reps-orange/60 bg-reps-panel/30"
                    : "border-reps-border bg-reps-panel/15"
                }`}
              >
                {recommended && (
                  <div className="absolute -top-3 left-6">
                    <Badge className="border-reps-orange/40 bg-reps-orange text-reps-ink">
                      Most popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-7">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="size-5 text-reps-orange" />
                    <h2 className="font-display text-[22px] text-white">
                      {tier.label}
                    </h2>
                    {tier.isFounding && (
                      <Badge className="border-emerald-400/30 bg-emerald-500/15 text-emerald-300">
                        Founding
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-white/55">
                    {tier.intervalLabel}
                  </p>
                  <p className="mt-4 font-display text-[36px] leading-none text-white">
                    {tier.priceLabel}
                  </p>
                  <p className="mt-5 text-[14px] text-white/70">{tier.blurb}</p>

                  <Button
                    onClick={() => beginCheckout(key, period)}
                    disabled={loadingTier !== null}
                    className={`mt-7 w-full ${
                      recommended
                        ? "bg-reps-orange text-reps-ink hover:bg-reps-orange/90"
                        : ""
                    }`}
                  >
                    {loadingTier === key ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Starting checkout…
                      </>
                    ) : (
                      <>
                        Continue with {tier.label} <ArrowRight className="size-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[13px] text-white/45">
          Studio (multi-seat) opens later in 2026 —{" "}
          <Link to="/contact" className="text-reps-orange hover:underline">
            join the waitlist
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
