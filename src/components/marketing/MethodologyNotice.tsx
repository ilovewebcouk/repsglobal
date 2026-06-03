import { Link } from "@tanstack/react-router";
import { Info } from "lucide-react";

import { DATA_VERIFIED_DATE } from "@/data/competitor-data";

/**
 * Small "Last checked / methodology" notice surfaced on every /compare page.
 * Two visual variants:
 *   - inline: muted text strip placed near the comparison table
 *   - card:   bordered block placed in the page footer area
 *
 * Wording is deliberately conservative: publicly available information,
 * collected on a stated date, may change, corrections welcome.
 */
export function MethodologyNotice({
  variant = "inline",
  vendorName,
  vendorPricingUrl,
}: {
  variant?: "inline" | "card";
  vendorName?: string;
  vendorPricingUrl?: string;
}) {
  const source = vendorName
    ? `${vendorName}'s publicly available pricing page`
    : "each vendor's publicly available pricing page";

  if (variant === "card") {
    return (
      <div className="rounded-[16px] border border-reps-border bg-reps-panel/40 p-5">
        <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-white/70">
          <Info className="h-3.5 w-3.5 text-reps-orange" aria-hidden />
          Comparison methodology
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-white/65">
          Last checked: <span className="text-white/85">{DATA_VERIFIED_DATE}</span>. Based on
          publicly available information collected from {source}
          {vendorPricingUrl ? (
            <>
              {" "}
              (
              <a
                href={vendorPricingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 underline underline-offset-2 hover:text-white"
              >
                source
              </a>
              )
            </>
          ) : null}
          . Competitor pricing and features may change. Read our{" "}
          <Link
            to="/comparison-methodology"
            className="text-reps-orange underline underline-offset-2 hover:text-white"
          >
            comparison methodology
          </Link>{" "}
          or{" "}
          <Link
            to="/contact"
            className="text-reps-orange underline underline-offset-2 hover:text-white"
          >
            request a correction
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[11.5px] text-white/50">
      <span className="inline-flex items-center gap-1.5 text-white/65">
        <Info className="h-3 w-3 text-reps-orange" aria-hidden />
        Last checked {DATA_VERIFIED_DATE}.
      </span>
      <span>
        Based on publicly available information from {source}. Pricing and features may change —
        see our{" "}
        <Link
          to="/comparison-methodology"
          className="text-white/75 underline underline-offset-2 hover:text-white"
        >
          comparison methodology
        </Link>{" "}
        or{" "}
        <Link
          to="/contact"
          className="text-white/75 underline underline-offset-2 hover:text-white"
        >
          request a correction
        </Link>
        .
      </span>
    </p>
  );
}
