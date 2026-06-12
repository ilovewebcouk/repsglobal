"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

const DashboardTooltipProvider = TooltipPrimitive.Provider;
const DashboardTooltip = TooltipPrimitive.Root;
const DashboardTooltipTrigger = TooltipPrimitive.Trigger;

const DashboardTooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs overflow-hidden rounded-[8px] border border-reps-border bg-reps-ink px-2.5 py-1.5 text-[12px] leading-snug text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.7)]",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
DashboardTooltipContent.displayName = "DashboardTooltipContent";

export {
  DashboardTooltip,
  DashboardTooltipTrigger,
  DashboardTooltipContent,
  DashboardTooltipProvider,
};
