import * as React from "react";
import { cn } from "@/lib/utils";

interface BlockHeadingProps {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}

/**
 * Canonical 50/50 in-block heading.
 *
 * Locked scale (do NOT override per page):
 *   mobile = 28px / lg = 36px / leading [1.1] / font-display / bold / white.
 *
 * Use this on every pillar / feature 50/50 block H3 so type stays in lockstep
 * across /for-professionals, /features/*, etc. Section H2s use SectionHeading.
 */
export function BlockHeading({ children, className, as: Tag = "h3" }: BlockHeadingProps) {
  return (
    <Tag
      className={cn(
        "font-display text-[28px] font-bold leading-[1.1] text-white lg:text-[36px]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
