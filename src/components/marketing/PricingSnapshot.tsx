import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Star } from "lucide-react";

import { PLANS } from "@/components/pricing/pricing-data";

export function PricingSnapshot() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {PLANS.map((p) => {
        const view = p.pricing.annual;
        return (
          <div
            key={p.tier}
            className={
              p.featured
                ? "relative flex flex-col rounded-[22px] border-2 border-reps-orange bg-gradient-to-b from-reps-panel to-reps-panel/80 p-7 shadow-none ring-1 ring-reps-orange/30 lg:-translate-y-2 lg:scale-[1.02]"
                : "relative flex flex-col rounded-[22px] border border-reps-border bg-reps-panel p-7 shadow-none"
            }
          >
            {p.featured && (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-reps-orange px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                <Star className="h-3 w-3 fill-white" /> Most popular
              </span>
            )}

            <h3 className="font-display text-[20px] font-bold text-white">{p.tier}</h3>
            <p className="mt-1 text-[13px] text-white/55">{p.desc}</p>

            <div className="mt-5 flex items-baseline gap-2">
              {view.was && (
                <span className="text-[16px] font-medium text-white/35 line-through">{view.was}</span>
              )}
              <span className="font-display text-[32px] font-bold text-white">{view.price}</span>
              <span className="text-[12px] text-white/55">{view.period}</span>
            </div>
            {view.meta && (
              <p className="mt-1 text-[12px] text-white/50">{view.meta}</p>
            )}
            {p.founding && (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-reps-orange-border bg-reps-orange-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-reps-orange">
                Founding price — limited
              </span>
            )}

            <Link
              to="/pricing"
              className={
                p.featured
                  ? "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-reps-orange text-[13px] font-semibold text-white hover:bg-reps-orange-hover"
                  : "mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[10px] border border-white/20 text-[13px] font-semibold text-white hover:bg-white/10"
              }
            >
              {p.cta} <ArrowRight className="h-4 w-4" />
            </Link>

            <ul className="mt-6 flex flex-col gap-2.5 text-[13px]">
              {p.features.slice(0, 6).map((f) => (
                <li key={f} className="flex items-start gap-2 text-white/75">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-reps-orange-soft text-reps-orange">
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
  );
}
