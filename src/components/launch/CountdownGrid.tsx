import { useEffect, useState } from "react";

import { LAUNCH_AT_UTC } from "@/lib/launch";

type Parts = { days: number; hours: number; minutes: number; seconds: number };

function computeParts(target: Date, now: number): Parts {
  const diff = Math.max(0, target.getTime() - now);
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds };
}

function pad(n: number, w = 2) {
  return n.toString().padStart(w, "0");
}

const LABELS: Array<{ key: keyof Parts; label: string; width: number }> = [
  { key: "days", label: "Days", width: 3 },
  { key: "hours", label: "Hours", width: 2 },
  { key: "minutes", label: "Minutes", width: 2 },
  { key: "seconds", label: "Seconds", width: 2 },
];

/**
 * Live four-cell countdown to LAUNCH_AT_UTC.
 *
 * Renders an SSR-safe initial frame from the request-time delta, then
 * upgrades to a 1s ticking client clock after hydration. Uses tabular-nums
 * so digits don't jitter.
 */
export function CountdownGrid() {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parts = computeParts(LAUNCH_AT_UTC, now);

  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={`Launching in ${parts.days} days, ${parts.hours} hours, ${parts.minutes} minutes`}
      className="grid grid-cols-4 gap-3 sm:gap-4"
    >
      {LABELS.map(({ key, label, width }) => (
        <div
          key={key}
          className="rounded-[22px] border border-reps-border bg-reps-panel/30 px-3 py-5 text-center backdrop-blur-sm sm:px-5 sm:py-7"
        >
          <div
            className="font-display text-[32px] font-bold leading-none tracking-tight text-white tabular-nums sm:text-[44px] lg:text-[64px]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {pad(parts[key], width)}
          </div>
          <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/55 sm:mt-3 sm:text-[11px] sm:tracking-[0.22em]">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
}
