import * as React from "react";
import { cn } from "@/lib/utils";

interface StatValueProps {
  children: React.ReactNode;
  className?: string;
  /** Use tabular-nums (recommended for dashboard / pricing figures). */
  tabular?: boolean;
}

/**
 * Display-typography numeric stat — pricing tier figures, dashboard mockup
 * stats, scorecards. Looks like a heading but is semantically a value, so
 * renders as `<span>` (not `<h2>`/`<h3>`).
 *
 * Default size is 28px (matches dashboard mockup tiles). Override per usage
 * via `className` (e.g. `text-[36px]` for pricing tier figures). twMerge
 * resolves the size override.
 */
export function StatValue({ children, className, tabular }: StatValueProps) {
  return (
    <span
      className={cn(
        "font-display text-[28px] font-bold text-white",
        tabular && "tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}
