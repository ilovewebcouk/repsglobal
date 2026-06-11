import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UpgradePanelProps = {
  /** Short feature title, e.g. "Bookings & payments". */
  feature: string;
  /** One-sentence description of what unlocks. */
  description: string;
  /** 3–6 short bullet points of what's included on Pro. */
  bullets?: string[];
  /** CTA label, defaults to "Upgrade to Pro". */
  ctaLabel?: string;
  /** Where the CTA goes, defaults to /pricing. */
  ctaTo?: string;
};

/**
 * Full-bleed dashboard upgrade panel shown when a Verified-tier trainer hits
 * a Pro-only route. Preserves the URL; sidebar stays mounted around it.
 */
export function UpgradePanel({
  feature,
  description,
  bullets,
  ctaLabel = "Upgrade to Pro",
  ctaTo = "/pricing",
}: UpgradePanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-[680px] flex-col items-start gap-6 rounded-[22px] border border-reps-border bg-reps-panel p-8">
      <div className="flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-reps-orange">
        <LockKeyhole className="h-3.5 w-3.5" />
        Pro feature
      </div>

      <div className="space-y-2">
        <h1 className="font-display text-[28px] font-bold leading-tight text-white">
          {feature}
        </h1>
        <p className="text-[15px] text-white/70">{description}</p>
      </div>

      {bullets && bullets.length > 0 ? (
        <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-2 rounded-[10px] border border-reps-border bg-reps-ink/40 px-3 py-2 text-[13px] text-white/80"
            >
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-reps-orange" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button asChild>
          <Link to={ctaTo}>
            {ctaLabel}
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
