/**
 * VerifiedBadge — shared, tiered credential badge.
 *
 * Tiered states:
 *   - none                 → ghost (greyscale, locked) — 0/3
 *   - identity             → "Verified" — 1/3
 *   - identity+insurance   → "Verified + Insured" — 2/3
 *   - full                 → "Verified + Insured + <Profession>" — 3/3
 *
 * Sizes: xs (16px), sm (22px), md (32px), lg (48px) — measured against the icon.
 * Used on: dashboard verification hero, sidebar nav chip.
 *
 * Visual rules (locked):
 *   - Flat fills only. Brand orange + emerald. No gradients.
 *   - Emerald = full credential state, orange = partial, neutral = locked.
 *   - No icons inside layers — layers stack as small dots/ribbons.
 */
import * as React from "react";
import { ShieldCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type VerifiedTier = "none" | "identity" | "identity+insurance" | "full";
export type VerifiedBadgeSize = "xs" | "sm" | "md" | "lg";

export function tierFromCounts(opts: {
  identity: boolean;
  insurance: boolean;
  qualifications: boolean;
}): VerifiedTier {
  if (opts.identity && opts.insurance && opts.qualifications) return "full";
  if (opts.identity && opts.insurance) return "identity+insurance";
  if (opts.identity) return "identity";
  return "none";
}

export function tierLabel(tier: VerifiedTier, profession?: string | null): string {
  switch (tier) {
    case "full":
      return profession ? `Verified · Insured · ${profession}` : "Verified · Insured · Qualified";
    case "identity+insurance":
      return "Verified · Insured";
    case "identity":
      return "Verified";
    case "none":
    default:
      return "Not yet verified";
  }
}

const SIZE_MAP: Record<
  VerifiedBadgeSize,
  { container: string; icon: string; text: string; gap: string }
> = {
  xs: { container: "h-6 px-2 gap-1", icon: "h-3 w-3", text: "text-[10px]", gap: "gap-0.5" },
  sm: { container: "h-7 px-2.5 gap-1.5", icon: "h-3.5 w-3.5", text: "text-[11px]", gap: "gap-1" },
  md: { container: "h-9 px-3 gap-2", icon: "h-4 w-4", text: "text-[13px]", gap: "gap-1" },
  lg: { container: "h-11 px-4 gap-2.5", icon: "h-5 w-5", text: "text-[14px]", gap: "gap-1.5" },
};

const TIER_CLASS: Record<VerifiedTier, string> = {
  full: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  "identity+insurance": "border-emerald-400/30 bg-emerald-500/15 text-emerald-300",
  identity: "border-reps-orange-border bg-reps-orange-soft text-reps-orange",
  none: "border-white/12 bg-white/[0.05] text-white/55",
};

export type VerifiedBadgeProps = {
  tier: VerifiedTier;
  size?: VerifiedBadgeSize;
  profession?: string | null;
  /** Override label entirely. */
  label?: string;
  /** Render only the layered shield (no text). */
  iconOnly?: boolean;
  className?: string;
};

/**
 * Pill-style badge with shield icon + tier dots indicating earned layers.
 */
export function VerifiedBadge({
  tier,
  size = "md",
  profession,
  label,
  iconOnly,
  className,
}: VerifiedBadgeProps) {
  const s = SIZE_MAP[size];
  const cls = TIER_CLASS[tier];
  const Icon = tier === "none" ? Shield : ShieldCheck;
  const text = label ?? tierLabel(tier, profession);
  const earned = tier === "full" ? 3 : tier === "identity+insurance" ? 2 : tier === "identity" ? 1 : 0;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-semibold",
        s.container,
        cls,
        className,
      )}
      aria-label={text}
      role="img"
    >
      <Icon className={cn(s.icon, "shrink-0")} aria-hidden />
      {iconOnly ? null : <span className={cn(s.text, "whitespace-nowrap")}>{text}</span>}
      {tier !== "none" ? <TierDots earned={earned} size={size} /> : null}
    </span>
  );
}

function TierDots({ earned, size }: { earned: number; size: VerifiedBadgeSize }) {
  const dot = size === "xs" || size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5";
  return (
    <span className={cn("ml-0.5 inline-flex items-center", size === "xs" ? "gap-[2px]" : "gap-0.5")} aria-hidden>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "rounded-full",
            dot,
            i <= earned ? "bg-current opacity-90" : "bg-current opacity-25",
          )}
        />
      ))}
    </span>
  );
}

/**
 * Sidebar count chip — "1/3", "2/3", "3/3". Compact, emerald when full.
 */
export function VerifiedCountChip({
  completed,
  className,
}: {
  completed: 0 | 1 | 2 | 3;
  className?: string;
}) {
  const full = completed === 3;
  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[34px] items-center justify-center rounded-full border px-1.5 text-[10px] font-semibold tabular-nums",
        full
          ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
          : "border-reps-orange-border bg-reps-orange-soft text-reps-orange",
        className,
      )}
      aria-label={full ? "Verification complete" : `Verification ${completed} of 3 complete`}
    >
      {completed}/3
    </span>
  );
}
