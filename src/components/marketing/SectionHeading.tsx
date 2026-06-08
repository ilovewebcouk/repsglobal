import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canonical marketing section H2.
 * Pure white, single colour. No orange split-word. No tracking-tight. Matches /specialisms exactly.
 */
export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <h2
      className={cn(
        "font-display text-[30px] font-bold leading-tight text-white lg:text-[40px]",
        className,
      )}
    >
      {children}
    </h2>
  );
}
