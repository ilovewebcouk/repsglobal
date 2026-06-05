import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Star, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  PLANS,
  type Billing,
  type PlanTierKey,
} from "./pricing-data";

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("annual");
  const [checkoutTier, setCheckoutTier] = useState<PlanTierKey | null>(null);
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);

  async function handlePaidCta(tierKey: PlanTierKey) {
    setCheckoutTier(tierKey);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        navigate({
          to: "/signup",
          search: { tier: tierKey, period: billing, next: "checkout" } as never,
        });
        return;
      }
      const result = await startCheckout({ data: { tier: tierKey, period: billing } });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutTier(null);
    }
  }

  return (
    <div>
      {/* Monthly / Annual toggle */}
      <div className="mb-10 flex justify-center">
        <ToggleGroup
          type="single"
          value={billing}
          onValueChange={(v) => v && setBilling(v as Billing)}
          className="inline-flex items-center gap-1 rounded-full border border-reps-border bg-reps-panel p-1"
        >
          {(["monthly", "annual"] as Billing[]).map((b) => (
            <ToggleGroupItem
              key={b}
              value={b}
              aria-label={b === "monthly" ? "Monthly billing" : "Annual billing"}
              className="flex h-9 items-center gap-2 rounded-full bg-transparent px-5 text-[13px] font-semibold text-white/65 hover:bg-transparent hover:text-white data-[state=on]:bg-reps-orange data-[state=on]:text-white"
            >
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && (
                <Badge
                  variant="outline"
                  className="rounded-full border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] uppercase tracking-wider text-reps-orange group-data-[state=on]:border-transparent group-data-[state=on]:bg-white/20 group-data-[state=on]:text-white"
                >
                  Save 2 months
                </Badge>
              )}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const view = p.pricing[billing];
          const isLoading = checkoutTier === p.tierKey;
          return (
            <Card
              key={p.tier}
              className={
                p.featured
                  ? "relative flex flex-col rounded-[22px] border-2 border-reps-orange bg-gradient-to-b from-reps-panel to-reps-panel/80 p-8 shadow-none ring-1 ring-reps-orange/30 lg:-translate-y-3 lg:scale-[1.03] lg:shadow-[0_30px_80px_-30px_rgba(255,122,0,0.45)]"
                  : "relative flex flex-col rounded-[22px] border border-reps-border bg-reps-panel p-7 shadow-none"
              }
            >
              {p.featured && (
                <Badge className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full border-transparent bg-reps-orange px-3 py-1 text-[11px] uppercase tracking-wider text-white hover:bg-reps-orange">
                  <Star className="h-3 w-3 fill-white" /> Most popular
                </Badge>
              )}

              <CardHeader className="p-0">
                <h3 className="font-display text-[20px] font-bold text-white">{p.tier}</h3>
                <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>
              </CardHeader>

              <CardContent className="flex flex-col gap-0 p-0">
                <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {view.was && (
                    <span className="text-[16px] font-medium text-white/35 line-through">{view.was}</span>
                  )}
                  <span className="font-display text-[38px] font-bold text-white">{view.price}</span>
                  <span className="text-[12px] text-white/55">{view.period}</span>
                </div>
                {view.meta && (
                  <div className="mt-1 text-[12px] text-white/55">{view.meta}</div>
                )}
                {p.founding && (
                  <div className="mt-3">
                    <Badge
                      variant="outline"
                      className="rounded-full border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-reps-orange"
                    >
                      Founding price — limited
                    </Badge>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col gap-6 p-0">
                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePaidCta(p.tierKey)}
                  variant={p.featured ? "default" : "outline"}
                  className={
                    p.featured
                      ? "mt-6 h-11 w-full rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover"
                      : "mt-6 h-11 w-full rounded-[10px] border-white/20 bg-transparent text-[13px] font-semibold text-white shadow-none hover:bg-white/10 hover:text-white"
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 data-icon="inline-start" className="animate-spin" />
                      Redirecting…
                    </>
                  ) : (
                    p.cta
                  )}
                </Button>

                <ul className="w-full space-y-2.5 text-[13px]">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-white/75">
                      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Enterprise strip */}
      <Card className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
        <CardContent className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[640px]">
            <div className="flex items-center gap-2 text-white/55">
              <Building2 className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">For organisations</span>
            </div>
            <h3 className="mt-2 font-display text-[22px] font-bold text-white">Enterprise</h3>
            <p className="mt-1 text-[13px] text-white/65">
              Chains, education providers and associations. Bulk verification, API access, migration,
              SSO, custom onboarding and SLAs.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 w-fit rounded-[10px] border-white/25 bg-transparent px-5 text-[13px] font-semibold text-white shadow-none hover:bg-white/10 hover:text-white"
          >
            <Link to="/contact">Contact us</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-[13px] text-white/55">
        Clients always search REPs for free. Pricing applies to professionals only.
      </div>
    </div>
  );
}
