import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared typography wrapper for Help Centre articles.
 * Locks the white opacity scale (white /55 /70 /85) and font sizing so every
 * article reads consistently on the dark surface.
 */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-none text-[15.5px] leading-[1.75] text-white/80",
        // Headings
        "[&_h2]:font-display [&_h2]:scroll-mt-28 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-[26px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-white",
        "[&_h3]:font-display [&_h3]:scroll-mt-28 [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:text-white",
        // Paragraphs + lists
        "[&_p]:my-4",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul>li]:my-1.5",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:my-1.5",
        // Inline
        "[&_strong]:font-semibold [&_strong]:text-white",
        "[&_a]:text-reps-orange [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-reps-orange/85",
        "[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_code]:text-white",
        // hr
        "[&_hr]:my-10 [&_hr]:border-white/10",
        className,
      )}
    >
      {children}
    </div>
  );
}
