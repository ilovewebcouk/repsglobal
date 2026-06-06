import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Sparkles } from "lucide-react";

import { PLANS } from "@/components/pricing/pricing-data";

const HIGHLIGHTS: Record<string, string[]> = {
  verified: [
    "Verified badge & credentials",
    "Reviews on the public record",
    "Enquiries inbox",
  ],
  pro: [
    "Personalised shop-front (/c/your-name)",
    "Leads, bookings, payments, CRM",
    "AI across the platform",
  ],
  studio: [
    "Everything in Pro",
    "Multi-coach roles & seats",
    "Organisation profile + reporting",
  ],
};

export function PricingSnapshot() {
  return (
    <div>
      <div className="mb-8 max-w-[680px]">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange">
          Pricing
        </span>
        <h2 className="mt-3 font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]">
          Three tiers. Every feature in your tier included — no paid add-ons.
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((p) => {
          const price = p.pricing.monthly;
          const featured = p.featured;
          return (
            <div
              key={p.tierKey}
              className={
                featured
                  ? "relative rounded-[22px] border border-reps-orange-border bg-gradient-to-br from-reps-orange-soft/40 to-reps-panel/60 p-6"
                  : "relative rounded-[22px] border border-reps-border bg-reps-panel/40 p-6"
              }
            >
              {p.founding && (
                <span className="absolute -top-2.5 left-5 inline-flex items-center gap-1 rounded-full border border-reps-orange-border bg-reps-ink px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                  <Sparkles className="h-3 w-3" /> Founding · locked for life
                </span>
              )}
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
                {p.tier}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-[34px] font-bold text-white">
                  {price.price}
                </span>
                {price.was && (
                  <span className="text-[14px] text-white/40 line-through">{price.was}</span>
                )}
                <span className="text-[12.5px] text-white/55">{price.period}</span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/65">{p.desc}</p>
              <ul className="mt-4 space-y-2 border-t border-reps-border pt-4">
                {HIGHLIGHTS[p.tierKey].map((h) => (
                  <li key={h} className="flex items-start gap-2 text-[13px] text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-reps-orange" />
                    {h}
                  </li>
                ))}
              </ul>
              <Link
                to={p.ctaHref}
                className={
                  featured
                    ? "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange px-5 text-[13.5px] font-semibold text-white hover:bg-reps-orange-hover"
                    : "mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-reps-border bg-reps-panel/60 px-5 text-[13.5px] font-semibold text-white hover:border-reps-orange-border"
                }
              >
                {p.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-white/55">
        <span>Annual saves 2 months on every tier.</span>
        <Link
          to="/pricing"
          className="inline-flex items-center gap-1 font-semibold text-reps-orange hover:underline"
        >
          See full pricing & compare tiers <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
