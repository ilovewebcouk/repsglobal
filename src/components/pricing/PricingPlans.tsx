import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Star, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

import { createCheckoutSession } from "@/lib/billing/billing.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  PLANS,
  STUDIO_PRICING,
  type Billing,
  type PlanTierKey,
} from "./pricing-data";

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("annual");
  const [checkoutTier, setCheckoutTier] = useState<PlanTierKey | null>(null);
  const navigate = useNavigate();
  const startCheckout = useServerFn(createCheckoutSession);

  async function handlePaidCta(tierKey: Exclude<PlanTierKey, "free">) {
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

              {p.tierKey === "free" ? (
                <Link
                  to={p.ctaHref}
                  className="mt-6 flex h-11 items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
                >
                  {p.cta}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={checkoutTier === p.tierKey}
                  onClick={() => handlePaidCta(p.tierKey as Exclude<PlanTierKey, "free">)}
                  className={
                    p.featured
                      ? "mt-6 flex h-11 items-center justify-center rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white shadow-none hover:bg-reps-orange-hover disabled:opacity-60"
                      : "mt-6 flex h-11 items-center justify-center rounded-[10px] border border-white/20 text-[13px] font-semibold text-white shadow-none hover:bg-white/10 disabled:opacity-60"
                  }
                >
                  {checkoutTier === p.tierKey ? "Redirecting…" : p.cta}
                </button>
              )}

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

      {/* Teams & organisations strip */}
      <div className="mt-10 overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel">
        <div className="grid gap-px bg-reps-border md:grid-cols-2">
          <div className="flex flex-col bg-reps-panel p-7">
            <div className="flex items-center gap-2 text-white/55">
              <Users className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">For teams</span>
            </div>
            <h3 className="mt-2 font-display text-[22px] font-bold text-white">Studio</h3>
            <p className="mt-1 text-[13px] text-white/55">Teams, gyms and multi-coach businesses.</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-[28px] font-bold text-white">{STUDIO_PRICING[billing].price}</span>
              <span className="text-[12px] text-white/55">{STUDIO_PRICING[billing].period}</span>
            </div>
            {STUDIO_PRICING[billing].meta && (
              <div className="mt-1 text-[12px] text-white/55">{STUDIO_PRICING[billing].meta}</div>
            )}
            <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] text-white/75 sm:grid-cols-2">
              {["Multi-coach roles", "Organisation profile", "Shared clients", "Locations", "Reporting"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-reps-orange" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-[10px] border border-white/20 px-4 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
            >
              Talk to sales
            </Link>
          </div>

          <div className="flex flex-col bg-reps-panel p-7">
            <div className="flex items-center gap-2 text-white/55">
              <Building2 className="h-4 w-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">For organisations</span>
            </div>
            <h3 className="mt-2 font-display text-[22px] font-bold text-white">Enterprise</h3>
            <p className="mt-1 text-[13px] text-white/55">Chains, education providers and associations.</p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-[28px] font-bold text-white">Custom</span>
              <span className="text-[12px] text-white/55">talk to us</span>
            </div>
            <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-[13px] text-white/75 sm:grid-cols-2">
              {["Bulk verification", "API access", "Migration", "SSO", "Custom onboarding", "SLAs"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-reps-orange" /> {f}
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="mt-5 inline-flex h-10 w-fit items-center justify-center rounded-[10px] border border-white/20 px-4 text-[13px] font-semibold text-white shadow-none hover:bg-white/10"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-[13px] text-white/55">
        Clients always search REPs for free. Pricing applies to professionals only.
      </div>
    </div>
  );
}
