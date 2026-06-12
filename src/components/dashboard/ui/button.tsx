import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * DashboardButton — dark-first button for the authenticated surface.
 *
 * Variants:
 *   primary           — brand orange, white text (default destructive-free CTA)
 *   ghost             — almost-transparent surface, matches public site
 *                       (replaces shadcn `outline` inside dashboards)
 *   subtle            — soft orange chip-button
 *   destructive-ghost — red text on ghost shell
 *   link              — inline text-only orange link button
 *
 * Sizing follows the locked radius scale: 10px corner, h-9 default / h-10 lg.
 * All variants are flat (`shadow-none`) — the brand rule forbids button shadows.
 */
export const dashboardButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13px] font-semibold leading-none shadow-none cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-reps-orange text-white hover:bg-reps-orange-hover active:bg-reps-orange-pressed",
        ghost:
          "border border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08] hover:border-white/20",
        subtle:
          "border border-reps-orange-border bg-reps-orange-soft text-reps-orange hover:bg-reps-orange/15",
        "destructive-ghost":
          "border border-red-400/25 bg-white/[0.03] text-red-300 hover:bg-red-500/10 hover:border-red-400/40",
        link: "h-auto rounded-none px-0 text-reps-orange hover:underline underline-offset-4",
      },
      size: {
        sm: "h-8 px-3 text-[12px]",
        md: "h-9 px-3.5",
        lg: "h-10 px-4 text-[14px]",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface DashboardButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dashboardButtonVariants> {
  asChild?: boolean;
}

export const DashboardButton = React.forwardRef<
  HTMLButtonElement,
  DashboardButtonProps
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(dashboardButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
});
DashboardButton.displayName = "DashboardButton";
