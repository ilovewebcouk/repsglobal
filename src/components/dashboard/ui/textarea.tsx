import * as React from "react";
import { cn } from "@/lib/utils";

const DashboardTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[96px] w-full resize-y rounded-[12px] border border-white/12 bg-white/[0.04] px-3 py-2.5 text-[13.5px] leading-relaxed text-white placeholder:text-white/40",
      "transition-colors focus-visible:outline-none focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/10",
      "aria-invalid:border-red-400/50 aria-invalid:ring-2 aria-invalid:ring-red-400/15",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
DashboardTextarea.displayName = "DashboardTextarea";

export { DashboardTextarea };
