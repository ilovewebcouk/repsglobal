import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Canonical marketing section eyebrow.
 * Bare span — no pill, no background, no icon. Matches /specialisms exactly.
 */
export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.22em] text-reps-orange",
        className,
      )}
    >
      {children}
    </span>
  );
}
