import * as React from "react";
import { Link } from "@tanstack/react-router";
import { LockKeyhole, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wraps Pro-only UI: shows the child blurred behind a lock badge for Verified.
 * On Pro/Studio, just renders children directly.
 */
export function ProLock({
  locked,
  feature,
  children,
  className,
}: {
  locked: boolean;
  feature: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className={cn("relative overflow-hidden rounded-[16px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none select-none blur-[3px] opacity-60"
      >
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-reps-ink/40 backdrop-blur-[1px]">
        <Link
          to="/pricing"
          className="group flex items-center gap-2 rounded-full border border-reps-orange-border bg-reps-orange-soft/90 px-3 py-1.5 text-[11.5px] font-semibold text-reps-orange shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-transform hover:-translate-y-0.5"
        >
          <LockKeyhole className="size-3.5" />
          <span>Unlock {feature} — upgrade to Pro</span>
          <Sparkles className="size-3.5 opacity-80 transition-opacity group-hover:opacity-100" />
        </Link>
      </div>
    </div>
  );
}
