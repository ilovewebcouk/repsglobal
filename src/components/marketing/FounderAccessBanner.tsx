import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** Optional wrapper className — defaults to a standalone bordered section. */
  className?: string;
  /** When true, removes the outer <section> wrapper so the banner can sit inside an existing section. */
  bare?: boolean;
};

/**
 * Founder Access — premium beta disclosure used across Pro/product-facing pages.
 * Slim, dark, orange-accented; links to /roadmap and /changelog.
 * Do not use as a warning; this is positioning.
 */
export function FounderAccessBanner({ className, bare = false }: Props) {
  const card = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[18px] border border-reps-orange/25 bg-reps-panel p-6 lg:p-7",
        "shadow-[0_0_0_1px_rgba(255,122,0,0.05),0_20px_60px_-30px_rgba(255,122,0,0.35)]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_0%_0%,rgba(255,122,0,0.10),transparent_60%)]"
      />
      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_auto] lg:items-center lg:gap-10">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-reps-orange/40 bg-reps-orange-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
            <Sparkles className="size-3" /> Founder Access
          </span>
          <h3 className="mt-3 font-display text-[20px] font-bold leading-snug text-white lg:text-[22px]">
            REPs Pro is launching in beta.
          </h3>
          <p className="mt-2 max-w-[640px] text-[14px] leading-relaxed text-white/70">
            Core tools are released first, with advanced coaching, nutrition, automation and
            integration features rolling out in stages. Founder members receive early access
            pricing while the platform continues to expand.
          </p>
          <p className="mt-2 text-[12.5px] text-white/55">
            Your founder rate remains active while your subscription stays active.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-stretch lg:gap-2">
          <Link
            to="/roadmap"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-reps-orange/40 bg-reps-orange/10 px-4 text-[13px] font-semibold text-reps-orange hover:bg-reps-orange/15"
          >
            View roadmap <ArrowRight className="size-3.5" />
          </Link>
          <Link
            to="/changelog"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-white/15 bg-white/5 px-4 text-[13px] font-semibold text-white/85 hover:bg-white/10"
          >
            See changelog
          </Link>
        </div>
      </div>
    </div>
  );

  if (bare) return card;

  return (
    <section className={cn("border-b border-reps-border bg-reps-ink", className)}>
      <div className="mx-auto max-w-[1320px] px-6 py-8 lg:px-10 lg:py-10">{card}</div>
    </section>
  );
}
