import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

interface TierCardProps {
  badge: string;
  price: string;
  blurb: string;
  cta: { to: string; label: string };
  highlighted?: boolean;
}

/**
 * Shared tier comparison card used in marketing pillar pages
 * (`/features/visibility`, `/features/shop-front`).
 * Visual shell is locked — pass copy via props.
 */
export function TierCard({ badge, price, blurb, cta, highlighted }: TierCardProps) {
  return (
    <div
      className={`rounded-[22px] p-7 ${
        highlighted
          ? "border border-reps-orange-border bg-reps-panel/70"
          : "border border-reps-border bg-reps-panel/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={
            highlighted
              ? "rounded-full bg-reps-orange px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
              : "rounded-full bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-reps-orange"
          }
        >
          {badge}
        </span>
        <span className="text-[12.5px] font-semibold text-white/55">{price}</span>
      </div>
      <p className="mt-4 text-[15.5px] leading-relaxed text-white/80">{blurb}</p>
      <Link
        to={cta.to}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] border border-white/20 px-5 text-[13.5px] font-semibold text-white shadow-none hover:bg-white/10"
      >
        {cta.label} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
