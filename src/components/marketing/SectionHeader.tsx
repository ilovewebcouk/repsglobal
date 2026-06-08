import { cn } from "@/lib/utils";
import { SectionEyebrow } from "./SectionEyebrow";
import { SectionHeading } from "./SectionHeading";

interface SectionHeaderProps {
  eyebrow: string;
  heading: React.ReactNode;
  lede?: React.ReactNode;
  /** Container max-width override (default ~760px column). */
  className?: string;
  /** Center content (default left). */
  align?: "left" | "center";
}

/**
 * Canonical marketing section header.
 * Pairs eyebrow + heading + optional lede with the rhythm /specialisms uses
 * (mt-3 between eyebrow → heading, mt-4 between heading → lede).
 */
export function SectionHeader({
  eyebrow,
  heading,
  lede,
  className,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-[760px]",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <SectionHeading className="mt-3">{heading}</SectionHeading>
      {lede ? (
        <p className="mt-4 text-[15px] leading-relaxed text-white/70">{lede}</p>
      ) : null}
    </div>
  );
}
