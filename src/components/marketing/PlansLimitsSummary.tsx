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
 * One row per competitor: logo · entry price · client cap · paid add-on count,
 * each linking into its `/compare/reps-vs-*` page. Replaces the heavier
 * `PlansLimitsStrip` on the hub; the strip still lives on each vs-page.
 */

const HREF_BY_SLUG: Record<Competitor["slug"], "/compare/reps-vs-trainerize" | "/compare/reps-vs-mypthub" | "/compare/reps-vs-pt-distinction"> = {
  "trainerize": "/compare/reps-vs-trainerize",
  "mypthub": "/compare/reps-vs-mypthub",
  "pt-distinction": "/compare/reps-vs-pt-distinction",
};

export function PlansLimitsSummary({
  competitors = COMPETITOR_LIST,
}: {
  competitors?: Competitor[];
}) {
  return (
    <div className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/40">
      {/* REPs reference row */}
      <div className="flex flex-col gap-3 border-b border-reps-border bg-reps-orange/10 px-5 py-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-[140px] items-center gap-2">
          <span className="font-display text-[15px] font-bold text-white">REPs Pro</span>
          <span className="rounded-full bg-reps-orange px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Recommended
          </span>
        </div>
        <SummaryFact label="Entry" value="£59/mo" emphasis />
        <SummaryFact label="Clients" value="Unlimited" emphasis />
        <SummaryFact label="Paid add-ons" value="None" emphasis />
        <div className="md:ml-auto">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-reps-orange hover:underline"
          >
            See REPs plans <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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
                className="group flex flex-col gap-3 px-5 py-4 transition hover:bg-reps-panel md:flex-row md:items-center md:gap-6"
              >
                <div className="flex min-w-[140px] items-center">
                  <img
                    src={c.logo}
                    alt={c.name}
                    style={{ height: c.logoHeight }}
                    className="w-auto opacity-90"
                  />
                </div>
                <SummaryFact label="Entry" value={entry.price} />
                <SummaryFact label="Clients" value={entry.clientCap} />
                <SummaryFact
                  label="Paid add-ons"
                  value={`${c.addOns.length}+`}
                  tone="bad"
                />
                <div className="md:ml-auto">
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
  tone,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  tone?: "bad";
}) {
  return (
    <div className="min-w-[110px]">
      <div className="text-[10px] uppercase tracking-wider text-white/45">{label}</div>
      <div
        className={[
          "mt-0.5 text-[13px] font-semibold",
          emphasis ? "text-reps-green" : tone === "bad" ? "text-white/85" : "text-white/85",
        ].join(" ")}
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
