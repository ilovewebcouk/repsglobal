import * as React from "react";

/**
 * Character counter shown under a field with a hard `maxLength`.
 * Neutral until 90% of max (amber), red once the cap is hit.
 */
export function FieldCounter({
  current,
  max,
  className = "",
}: {
  current: number;
  max: number;
  className?: string;
}) {
  const pct = max > 0 ? current / max : 0;
  const tone =
    current >= max
      ? "text-red-400"
      : pct >= 0.9
        ? "text-amber-400"
        : "text-white/45";
  return (
    <div
      className={`mt-1 flex justify-end text-[11px] tabular-nums ${tone} ${className}`}
      aria-live="polite"
    >
      {current} / {max}
    </div>
  );
}
