import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const dashboardBadgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 h-5 text-[11px] font-semibold leading-none whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "bg-white/[0.06] text-white/80 border-white/12",
        orange: "bg-reps-orange-soft text-reps-orange border-reps-orange-border",
        success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
        warn: "bg-amber-500/12 text-amber-300 border-amber-400/30",
        danger: "bg-red-500/10 text-red-300 border-red-400/25",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface DashboardBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof dashboardBadgeVariants> {}

export function DashboardBadge({ className, variant, ...props }: DashboardBadgeProps) {
  return <span className={cn(dashboardBadgeVariants({ variant }), className)} {...props} />;
}
