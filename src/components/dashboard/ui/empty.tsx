import * as React from "react";
import { cn } from "@/lib/utils";

const DashboardEmpty = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[16px] border border-dashed border-white/12 bg-white/[0.02] px-6 py-10 text-center text-white",
        className,
      )}
      {...props}
    />
  ),
);
DashboardEmpty.displayName = "DashboardEmpty";

const DashboardEmptyIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex size-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70 [&_svg]:size-5",
        className,
      )}
      {...props}
    />
  ),
);
DashboardEmptyIcon.displayName = "DashboardEmptyIcon";

const DashboardEmptyTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-[15px] font-semibold text-white", className)} {...props} />
  ),
);
DashboardEmptyTitle.displayName = "DashboardEmptyTitle";

const DashboardEmptyDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("max-w-sm text-[13px] leading-relaxed text-white/65", className)} {...props} />
  ),
);
DashboardEmptyDescription.displayName = "DashboardEmptyDescription";

const DashboardEmptyActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-1 flex flex-wrap items-center justify-center gap-2", className)} {...props} />
  ),
);
DashboardEmptyActions.displayName = "DashboardEmptyActions";

export {
  DashboardEmpty,
  DashboardEmptyIcon,
  DashboardEmptyTitle,
  DashboardEmptyDescription,
  DashboardEmptyActions,
};
