import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  COMPETITOR_LIST,
  DATA_VERIFIED_DATE,
  type Competitor,
} from "@/data/competitor-data";

/**
 * Compact plans & limits summary for the /compare hub.
 *
 * Shared grid across all rows so the Entry / Clients / Paid add-ons columns
 * line up across REPs + competitors. The "Recommended" pill sits as an
 * absolute corner badge on the REPs row so it never consumes grid space.
 */

const HREF_BY_SLUG: Record<
  Competitor["slug"],
  "/compare/reps-vs-trainerize" | "/compare/reps-vs-mypthub" | "/compare/reps-vs-pt-distinction"
> = {
  trainerize: "/compare/reps-vs-trainerize",
  mypthub: "/compare/reps-vs-mypthub",
  "pt-distinction": "/compare/reps-vs-pt-distinction",
};

const ROW_GRID =
  "grid grid-cols-1 gap-3 md:grid-cols-[180px_120px_160px_130px_1fr] md:items-center md:gap-6";

export function PlansLimitsSummary({
  competitors = COMPETITOR_LIST,
}: {
  competitors?: Competitor[];
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/40">
      {/* REPs reference row */}
      <div className="relative border-b border-reps-border bg-reps-orange/10 px-5 py-4 pr-5 md:pr-32">
        <span className="absolute right-4 top-4 inline-flex h-6 items-center rounded-full bg-reps-orange px-2.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Recommended
        </span>
        <div className={ROW_GRID}>
          <div className="flex min-w-0 items-center">
            <span className="font-display text-[15px] font-bold text-white">REPs Pro</span>
          </div>
          <SummaryFact label="Entry" value="£59/mo" emphasis />
          <SummaryFact label="Clients" value="Unlimited" emphasis />
          <SummaryFact label="Paid add-ons" value="None" emphasis />
          <div className="md:justify-self-end">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-reps-orange hover:underline"
            >
              See REPs plans <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Competitor rows */}
      <ul className="divide-y divide-reps-border">
        {competitors.map((c) => {
          const entry = c.tiers[0];
          return (
            <li key={c.slug}>
              <Link
                to={HREF_BY_SLUG[c.slug]}
                className={`group px-5 py-4 transition hover:bg-reps-panel ${ROW_GRID}`}
              >
                <div className="flex min-w-0 items-center">
                  <img
                    src={c.logo}
                    alt={c.name}
                    style={{ height: c.logoHeight }}
                    className="w-auto opacity-90"
                  />
                </div>
                <SummaryFact label="Entry" value={entry.price} />
                <SummaryFact label="Clients" value={entry.clientCap} />
                <SummaryFact label="Paid add-ons" value={`${c.addOns.length}+`} />
                <div className="md:justify-self-end">
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/70 group-hover:text-reps-orange">
                    Compare
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SummaryFact({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div
        className={`mt-0.5 text-[13px] font-semibold ${
          emphasis ? "text-reps-green" : "text-white/85"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function PlansLimitsSummaryFootnote() {
  return (
    <p className="mt-3 text-[11px] text-white/40">
      Pricing, limits and add-ons verified {DATA_VERIFIED_DATE} from each
      platform&apos;s public pricing page. Tap a row for the full head-to-head.
    </p>
  );
}
