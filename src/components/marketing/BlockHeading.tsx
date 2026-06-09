import { cn } from "@/lib/utils";

interface BlockHeadingProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canonical 50/50 in-block H3.
 * Pure white, single colour. 28px → 36px at lg. Pairs with SectionHeading (H2)
 * inside ProductBlock and any other in-section content block.
 */
export function BlockHeading({ children, className }: BlockHeadingProps) {
  return (
    <h3
      className={cn(
        "font-display text-[28px] font-bold leading-tight text-white lg:text-[36px]",
        className,
      )}
    >
      {children}
    </h3>
  );
}
