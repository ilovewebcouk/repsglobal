import * as React from "react";
import { cn } from "@/lib/utils";

const DashboardCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-[16px] border border-reps-border bg-reps-panel text-white", className)}
      {...props}
    />
  ),
);
DashboardCard.displayName = "DashboardCard";

const DashboardCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />
  ),
);
DashboardCardHeader.displayName = "DashboardCardHeader";

const DashboardCardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-[15px] font-semibold leading-tight text-white", className)} {...props} />
  ),
);
DashboardCardTitle.displayName = "DashboardCardTitle";

const DashboardCardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-[13px] leading-relaxed text-white/70", className)} {...props} />
  ),
);
DashboardCardDescription.displayName = "DashboardCardDescription";

const DashboardCardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />
  ),
);
DashboardCardContent.displayName = "DashboardCardContent";

const DashboardCardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center gap-2 border-t border-white/8 p-5 pt-3", className)}
      {...props}
    />
  ),
);
DashboardCardFooter.displayName = "DashboardCardFooter";

export {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
  DashboardCardFooter,
};
