import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DashboardInput — dark-first input for the authenticated surface.
 * Tokens: bg-white/[0.04], border-white/12, text-white, rounded-[12px].
 */
const DashboardInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-[12px] border border-white/12 bg-white/[0.04] px-3 py-2 text-[13.5px] text-white placeholder:text-white/40",
      "transition-colors focus-visible:outline-none focus-visible:border-white/30 focus-visible:ring-2 focus-visible:ring-white/10",
      "aria-invalid:border-red-400/50 aria-invalid:ring-2 aria-invalid:ring-red-400/15",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-white/80",
      className,
    )}
    {...props}
  />
));
DashboardInput.displayName = "DashboardInput";

export { DashboardInput };
