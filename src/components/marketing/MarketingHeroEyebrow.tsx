import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketingHeroEyebrowProps {
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  /** Inline animation style — pass through fade-in delays from the hero. */
  style?: React.CSSProperties;
  /** Include the `animate-fade-in` class (default true). */
  animate?: boolean;
}

/**
 * Canonical marketing hero eyebrow.
 * Animated border-pill with a bare orange icon inside (no orange-soft fill).
 * Matches /specialisms hero exactly.
 */
export function MarketingHeroEyebrow({
  icon: Icon,
  children,
  className,
  style,
  animate = true,
}: MarketingHeroEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-reps-border bg-reps-panel/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur",
        animate && "animate-fade-in",
        className,
      )}
      style={style}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 text-reps-orange" /> : null}
      {children}
    </span>
  );
}
