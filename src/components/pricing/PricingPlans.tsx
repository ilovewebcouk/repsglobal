import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Star, Building2 } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { supabase } from "@/integrations/supabase/client";
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
        <div className="inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel p-1">
          {(["monthly", "annual"] as Billing[]).map((b) => {
            const active = billing === b;
            return (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                className={
                  active
                    ? "flex h-9 items-center gap-2 rounded-full bg-reps-orange px-5 text-[13px] font-semibold text-white shadow-none"
                    : "flex h-9 items-center gap-2 rounded-full px-5 text-[13px] font-semibold text-white/65 hover:text-white"
                }
              >
                {b === "monthly" ? "Monthly" : "Annual"}
                {b === "annual" && (
                  <span
                    className={
                      active
                        ? "rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                        : "rounded-full border border-reps-orange-border bg-reps-orange-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange"
                    }
                  >
                    Save 2 months
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => {
          const view = p.pricing[billing];
          return (
            <div
              key={p.tier}
              className={
                p.featured
                  ? "relative flex flex-col rounded-[22px] border-2 border-reps-orange bg-reps-panel p-7"
                  : "relative flex flex-col rounded-[22px] border border-reps-border bg-reps-panel p-7"
              }
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                  <Star className="h-3 w-3 fill-white" /> Most popular
                </span>
              )}

              <h3 className="font-display text-[20px] font-bold text-white">{p.tier}</h3>
              <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>

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
                  <span className="inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                    Founding price — limited
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={checkoutTier === p.tierKey}
                onClick={() => handlePaidCta(p.tierKey)}
                className={
                  p.featured
                    ? "mt-6 flex h-11 items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover disabled:opacity-60"
                    : "mt-6 flex h-11 items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white shadow-none hover:bg-white/10 disabled:opacity-60"
                }
              >
                {checkoutTier === p.tierKey ? "Redirecting…" : p.cta}
              </button>

              <ul className="mt-6 space-y-2.5 text-[13px]">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-white/75">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Enterprise strip */}
      <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
        <div className="flex flex-col gap-6 p-7 lg:flex-row lg:items-center lg:justify-between">
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
          <Link
            to="/contact"
            className="inline-flex h-11 w-fit items-center justify-center rounded-[10px] border border-white/25 px-5 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
          >
            Contact us
          </Link>
        </div>
      </div>

      <div className="mt-6 text-center text-[13px] text-white/55">
        Clients always search REPs for free. Pricing applies to professionals only.
      </div>
    </div>
  );
}
