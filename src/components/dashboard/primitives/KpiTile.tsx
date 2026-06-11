import * as React from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiTileProps = {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down" | "flat";
  icon?: LucideIcon;
  className?: string;
};

/**
 * Standard dashboard KPI tile. 16px radius, panel surface, optional trend chip.
 * Use inside a grid (e.g. `grid grid-cols-2 md:grid-cols-4 gap-3`).
 */
export function KpiTile({ label, value, delta, trend = "flat", icon: Icon, className }: KpiTileProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : null;
  const trendCls =
    trend === "up"
      ? "text-emerald-300"
      : trend === "down"
        ? "text-white/55"
        : "text-white/55";
  return (
    <div
      className={cn(
        "rounded-[16px] border border-reps-border bg-reps-panel p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/55">
          {label}
        </span>
        {Icon ? <Icon className="h-4 w-4 text-white/45" /> : null}
      </div>
      <div className="mt-2 font-display text-[24px] font-bold leading-none text-white">
        {value}
      </div>
      {delta ? (
        <div className={cn("mt-2 flex items-center gap-1 text-[12px] font-medium", trendCls)}>
          {TrendIcon ? <TrendIcon className="h-3.5 w-3.5" /> : null}
          <span>{delta}</span>
        </div>
      ) : null}
    </div>
  );
}
