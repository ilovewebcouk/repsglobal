import wordmarkUrl from "@/assets/brand/reps-wordmark.svg";
import { cn } from "@/lib/utils";

type RepsWordmarkProps = {
  className?: string;
  title?: string;
};

/**
 * REPs wordmark — Inter ExtraBold (28pt, 25 tracking) converted to outlined SVG paths.
 * Source: src/assets/brand/reps-wordmark.svg.
 * Inherits colour from `currentColor`, so set text colour via Tailwind (e.g. text-white).
 * Width is derived from the viewBox; size by setting a height class.
 */
export function RepsWordmark({ className, title = "REPs" }: RepsWordmarkProps) {
  return (
    <img
      src={wordmarkUrl}
      alt={title}
      className={cn("h-5 w-auto select-none", className)}
      draggable={false}
    />
  );
}
