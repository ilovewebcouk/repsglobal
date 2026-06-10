import { cn } from "@/lib/utils";

type RepsWordmarkProps = {
  className?: string;
  title?: string;
};

/**
 * REPs wordmark — Inter ExtraBold (28pt, 25 tracking) converted to outlined SVG paths.
 * Paths generated from the Inter ExtraBold TTF (UPEM 2048) with Illustrator's
 * 25/1000 em tracking baked into per-glyph X offsets.
 * Inherits colour from `currentColor`, so set text colour via Tailwind (e.g. text-white).
 * Width is derived from the viewBox; size by setting a height class.
 */
export function RepsWordmark({ className, title = "REPs" }: RepsWordmarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 267.34 48.17"
      fill="currentColor"
      role="img"
      aria-label={title}
      className={cn("h-5 w-auto select-none", className)}
    >
      <path d="M53.86,33.34l14.55,14.83h-19.66l-12.1-12.82H14.83v12.82H0v-24.84h42.7c5.47,0,7.85-1.58,7.85-5.18,0-3.89-2.52-5.62-7.92-5.62H0L9.94,0h31.25c15.12,0,24.27,6.55,24.27,17.57,0,7.49-4.25,12.96-11.59,15.77Z" />
      <polyline points="73.8 18.72 126.8 18.72 118.16 29.38 88.71 29.38 88.71 35.64 129.68 35.64 120.17 48.17 73.8 48.17" />
      <polyline points="73.8 0 129.6 0 119.96 12.53 73.8 12.53" />
      <path d="M149.47,35.72v12.46h-14.83v-24.77h42.34c4.03,0,6.48-2.09,6.48-5.47s-2.52-5.4-6.48-5.4h-42.34l10.01-12.53h30.67c13.97,0,22.97,7.06,22.97,18s-8.86,17.71-22.97,17.71h-25.85Z" />
      <path d="M201.89,48.17l9.58-12.53h36.87c3.02,0,4.39-.94,4.39-3.1s-1.44-3.17-4.54-3.17h-26.07c-11.74,0-18.51-5.33-18.51-14.47,0-9.94,6.7-14.91,20.31-14.91h42.12l-9.58,12.53h-33.7c-3.1,0-4.54,1.01-4.54,3.1s1.44,3.17,4.54,3.17h26.28c11.95,0,18.29,4.82,18.29,13.97,0,10.58-6.05,15.41-19.44,15.41h-46.01Z" />
    </svg>
  );
}
