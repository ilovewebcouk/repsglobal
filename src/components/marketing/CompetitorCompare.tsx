import * as React from "react";
import { Check, ChevronsRight, Minus } from "lucide-react";
import trainerizeLogo from "@/assets/logos/trainerize.svg.asset.json";
import mypthubLogo from "@/assets/logos/mypthub.svg.asset.json";
import ptDistinctionLogo from "@/assets/logos/pt-distinction.svg.asset.json";
import { RepsWordmark } from "@/components/brand/RepsWordmark";

import { FEATURE_GROUPS, type Cell } from "@/data/feature-matrix";
import {
  PlansLimitsSummary,
  PlansLimitsSummaryFootnote,
} from "@/components/marketing/PlansLimitsSummary";
import { MethodologyNotice } from "@/components/marketing/MethodologyNotice";

type Col = { label: string; logo?: string; logoHeight?: number };

const COLS: readonly Col[] = [
  { label: "REPs" },
  { label: "Trainerize", logo: trainerizeLogo.url, logoHeight: 22 },
  { label: "MyPTHub", logo: mypthubLogo.url, logoHeight: 24 },
  { label: "PT Distinction", logo: ptDistinctionLogo.url, logoHeight: 20 },
] as const;

export function CompetitorCompare() {
  return (
    <div>
      <div className="max-w-[760px]">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          The honest comparison
        </span>
        <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[44px]">
          REPs vs every other coaching app.
        </h2>
        <p className="mt-3 max-w-[640px] text-[15px] text-white/65">
          Trainerize, MyPTHub and PT Distinction give you software — and a list of
          paid add-ons. REPs Pro is £59/mo founding (was £79/mo) and includes the
          full software platform — no paid add-on stack, no per-client charges.
        </p>
      </div>

      {/* Plans & limits summary — compact row per platform, links into each vs-page */}
      <div className="mt-10">
        <h3 className="font-display text-[18px] font-semibold text-white/85">
          Plans &amp; limits at a glance
        </h3>
        <p className="mt-1 text-[13px] text-white/55">
          Entry price, client cap and paid add-on count. Tap a row for the full
          head-to-head.
        </p>
        <div className="mt-5">
          <PlansLimitsSummary />
        </div>
        <PlansLimitsSummaryFootnote />
      </div>

      {/* Mobile/tablet swipe hint — placed above the feature table */}
      <div className="mt-12 flex items-center gap-2 text-[12px] font-medium text-white/55 lg:hidden">
        <ChevronsRight className="h-4 w-4 text-reps-orange" aria-hidden />
        Swipe to compare other platforms
      </div>

      <h3 className="mt-12 font-display text-[18px] font-semibold text-white/85 lg:mt-16">
        Feature-by-feature
      </h3>

      {/* Responsive table: sticky Feature + REPs columns on tablet/mobile, full width on desktop */}
      <div className="mt-3 overflow-clip rounded-[22px] border border-reps-border bg-reps-ink lg:mt-5">
        <div
          className="overflow-x-auto [overflow-y:clip] lg:overflow-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left lg:min-w-0">
            <thead className="sticky top-[72px] z-20">
              <tr className="bg-reps-panel">
                <th
                  scope="col"
                  className="sticky left-0 z-20 w-[140px] min-w-[140px] bg-reps-panel px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50 shadow-[1px_0_0_0_var(--reps-border)] md:w-[220px] md:min-w-[220px] md:px-5 lg:w-[32%] lg:shadow-none"
                >
                  Feature
                </th>
                {COLS.map((c, i) => (
                  <th
                    key={c.label}
                    scope="col"
                    className={[
                      "px-4 py-4 text-[13px] font-display font-bold md:px-5",
                      i === 0
                        ? "sticky left-[140px] z-20 w-[110px] min-w-[110px] bg-reps-orange-tint text-reps-orange shadow-[1px_0_0_0_var(--reps-border),6px_0_8px_-6px_rgba(0,0,0,0.4)] md:left-[220px] md:w-[150px] md:min-w-[150px] lg:static lg:w-auto lg:min-w-0 lg:bg-reps-orange-soft lg:shadow-none"
                        : "min-w-[150px] text-white/80 md:min-w-[170px]",
                    ].join(" ")}
                  >
                    {i === 0 ? (
                      <RepsWordmark className="h-[22px] text-reps-orange lg:text-reps-orange" />
                    ) : c.logo ? (
                      <img
                        src={c.logo}
                        alt={c.label}
                        style={{ height: c.logoHeight ?? 22 }}
                        className="w-auto"
                      />
                    ) : (
                      c.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURE_GROUPS.map((group) => (
                <React.Fragment key={group.label}>
                  <tr>
                    <td
                      colSpan={5}
                      className="bg-reps-ink px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange md:px-5"
                    >
                      <span className="sticky left-4 md:left-5 lg:static">
                        {group.label}
                      </span>
                    </td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.feature} className="[&>*]:border-t [&>*]:border-reps-border/40">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-reps-panel px-4 py-4 text-left text-[13px] font-semibold text-white/90 shadow-[1px_0_0_0_var(--reps-border)] md:px-5 md:text-[13.5px] lg:bg-reps-panel/30 lg:shadow-none"
                      >
                        {row.feature}
                      </th>
                      {row.cells.map((cell, ci) => (
                        <td
                          key={ci}
                          className={[
                            "px-4 py-4 align-top text-[12.5px] md:px-5 md:text-[13px]",
                            ci === 0
                              ? "sticky left-[140px] z-10 bg-reps-orange-tint shadow-[1px_0_0_0_var(--reps-border),6px_0_8px_-6px_rgba(0,0,0,0.4)] md:left-[220px] lg:static lg:bg-reps-orange-soft/40 lg:shadow-none"
                              : "bg-reps-panel/20",
                          ].join(" ")}
                        >
                          <CellIcon cell={cell} highlight={ci === 0} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-white/40">
        Comparisons reflect publicly available product information at time of writing.
        Trainerize, MyPTHub, PT Distinction and MyFitnessPal are trademarks of their
        respective owners.
      </p>

      <MethodologyNotice />
    </div>
  );
}

export function CellIcon({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
  if (cell.kind === "yes") {
    return (
      <div className="flex items-start gap-2">
        <Check
          className={`mt-0.5 h-4 w-4 shrink-0 ${
            highlight ? "text-reps-orange" : "text-reps-green"
          }`}
        />
        {cell.note && <span className="text-white/70">{cell.note}</span>}
      </div>
    );
  }
  if (cell.kind === "partial") {
    return <span className="text-white/65">{cell.note}</span>;
  }
  return (
    <div className="flex items-start gap-2">
      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      {cell.note && <span className="text-white/45">{cell.note}</span>}
    </div>
  );
}
