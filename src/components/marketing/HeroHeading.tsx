import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canonical marketing hero H1 — used on /for-professionals, /cpd, /compare.
 *
 * Owns the recipe (`font-display font-bold text-white`) so route files never
 * hand-roll it. Per-page hero sizes remain frozen by their respective LOCKED
 * page memories; callers pass a `className` (twMerge handles override) to
 * keep the exact visual output of each locked page. Animation-related
 * `style`/`className` (e.g. `animate-fade-in`, animationDelay) pass through.
 */
export function HeroHeading({ children, className, ...rest }: HeroHeadingProps) {
  return (
    <h1
      {...rest}
      className={cn(
        "font-display font-bold leading-[1.05] text-white",
        "text-[36px] sm:text-[46px] lg:text-[60px]",
        className,
      )}
    >
      {children}
    </h1>
  );
}
