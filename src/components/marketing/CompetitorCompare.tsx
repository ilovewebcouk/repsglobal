import * as React from "react";
import trainerizeLogo from "@/assets/logos/trainerize.svg.asset.json";
import mypthubLogo from "@/assets/logos/mypthub.svg.asset.json";
import ptDistinctionLogo from "@/assets/logos/pt-distinction.svg.asset.json";

type Cell =
  | { kind: "yes"; note?: string }
  | { kind: "partial"; note: string }
  | { kind: "no"; note?: string };

type Col = { label: string; logo?: string; logoHeight?: number };

const COLS: readonly Col[] = [
  { label: "REPs" },
  { label: "Trainerize", logo: trainerizeLogo.url, logoHeight: 22 },
  { label: "MyPTHub", logo: mypthubLogo.url, logoHeight: 24 },
  { label: "PT Distinction", logo: ptDistinctionLogo.url, logoHeight: 20 },
] as const;

type Row = { feature: string; cells: [Cell, Cell, Cell, Cell] };
type Group = { label: string; rows: Row[] };

const GROUPS: Group[] = [
  {
    label: "Visibility · Get discovered",
    rows: [
      {
        feature: "Found by clients searching the public register",
        cells: [
          { kind: "yes", note: "Searched by the public daily" },
          { kind: "no", note: "Bring your own clients" },
          { kind: "no", note: "Bring your own clients" },
          { kind: "no", note: "Bring your own clients" },
        ],
      },
      {
        feature: "Industry-recognised REPs credential",
        cells: [
          { kind: "yes", note: "REPs verified since 2009" },
          { kind: "no" },
          { kind: "no" },
          { kind: "no" },
        ],
      },
      {
        feature: "Verified qualifications & insurance",
        cells: [
          { kind: "yes", note: "Checked by humans" },
          { kind: "no", note: "Self-declared" },
          { kind: "no", note: "Self-declared" },
          { kind: "no", note: "Self-declared" },
        ],
      },
      {
        feature: "CPD tracked on profile",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Reviews on the public record",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
  {
    label: "Operations · Run your practice",
    rows: [
      {
        feature: "Lead pipeline (profile, IG, website)",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic CRM" },
          { kind: "partial", note: "Basic CRM" },
          { kind: "partial", note: "Basic CRM" },
        ],
      },
      {
        feature: "Bookings + deposits + Stripe payouts",
        cells: [
          { kind: "yes", note: "Deposits, subs, payouts" },
          { kind: "partial", note: "Payments only" },
          { kind: "yes" },
          { kind: "partial", note: "Add-on" },
        ],
      },
      {
        feature: "Clients CRM (one record per client)",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic" },
          { kind: "partial", note: "Basic" },
          { kind: "partial", note: "Basic" },
        ],
      },
      {
        feature: "Focused inbox + quiet hours",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Chat only" },
          { kind: "partial", note: "Chat only" },
          { kind: "partial", note: "Chat only" },
        ],
      },
    ],
  },
  {
    label: "Coaching · Deliver the work",
    rows: [
      {
        feature: "Programme builder + video library",
        cells: [{ kind: "yes" }, { kind: "yes" }, { kind: "yes" }, { kind: "yes" }],
      },
      {
        feature: "Nutrition planning + food database",
        cells: [
          { kind: "yes", note: "Replaces MyFitnessPal" },
          { kind: "partial", note: "Macros only" },
          { kind: "partial", note: "Macros only" },
          { kind: "partial", note: "Macros only" },
        ],
      },
      {
        feature: "Weekly check-ins with photos & metrics",
        cells: [{ kind: "yes" }, { kind: "yes" }, { kind: "yes" }, { kind: "yes" }],
      },
      {
        feature: "Branded client portal (web + mobile)",
        cells: [
          { kind: "yes" },
          { kind: "yes", note: "Trainerize-branded" },
          { kind: "partial", note: "Web portal" },
          { kind: "yes" },
        ],
      },
    ],
  },
  {
    label: "REPs AI · The operating layer",
    rows: [
      {
        feature: "AI Business Command Centre",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Weekly 'next move' growth card",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI programme writer",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI nutrition planner",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI check-in summariser",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI lead scoring + reply drafts",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI client risk & plateau alerts",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "AI content studio (posts, captions, lead magnets)",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
  {
    label: "Growth · Compound the practice",
    rows: [
      {
        feature: "Revenue & retention insights",
        cells: [
          { kind: "yes" },
          { kind: "partial", note: "Basic reports" },
          { kind: "partial", note: "Basic reports" },
          { kind: "partial", note: "Basic reports" },
        ],
      },
      {
        feature: "Automated client follow-ups & win-backs",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
      {
        feature: "Renewal forecasting & churn risk",
        cells: [{ kind: "yes" }, { kind: "no" }, { kind: "no" }, { kind: "no" }],
      },
    ],
  },
];

const ALL_ROWS = GROUPS.flatMap((g) => g.rows);

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
          Trainerize, MyPTHub and PT Distinction give you software. REPs brings clients,
          replaces six other apps and ships the AI layer none of them have.
        </p>
      </div>

      {/* Desktop / tablet table */}
      <div className="mt-10 hidden overflow-hidden rounded-[22px] border border-reps-border md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-reps-panel/80">
              <th
                scope="col"
                className="w-[32%] px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50"
              >
                Feature
              </th>
              {COLS.map((c, i) => (
                <th
                  key={c.label}
                  scope="col"
                  className={`px-5 py-4 text-[13px] font-display font-bold ${
                    i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/80"
                  }`}
                >
                  {c.logo ? (
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
            {GROUPS.map((group) => (
              <React.Fragment key={group.label}>
                <tr className="bg-reps-ink">
                  <td
                    colSpan={5}
                    className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-reps-orange"
                  >
                    {group.label}
                  </td>
                </tr>
                {group.rows.map((row, ri) => (
                  <tr
                    key={row.feature}
                    className={ri % 2 === 0 ? "bg-reps-panel/30" : "bg-reps-panel/10"}
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 text-left text-[13.5px] font-semibold text-white/90"
                    >
                      {row.feature}
                    </th>
                    {row.cells.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`px-5 py-4 align-top text-[13px] ${
                          ci === 0 ? "bg-reps-orange-soft/40" : ""
                        }`}
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

      {/* Mobile: stacked per-row cards */}
      <div className="mt-8 grid gap-4 md:hidden">
        {ALL_ROWS.map((row) => (
          <div
            key={row.feature}
            className="rounded-[16px] border border-reps-border bg-reps-panel p-4"
          >
            <div className="text-[13.5px] font-semibold text-white">{row.feature}</div>
            <ul className="mt-3 space-y-2">
              {COLS.map((c, i) => (
                <li
                  key={c.label}
                  className={`flex items-start gap-2 rounded-[10px] px-3 py-2 ${
                    i === 0 ? "bg-reps-orange-soft" : "bg-reps-ink/40"
                  }`}
                >
                  <span
                    className={`flex min-w-[88px] items-center text-[11px] font-semibold uppercase tracking-wider ${
                      i === 0 ? "text-reps-orange" : "text-white/55"
                    }`}
                  >
                    {c.logo ? (
                      <img
                        src={c.logo}
                        alt={c.label}
                        style={{ height: 14 }}
                        className="w-auto"
                      />
                    ) : (
                      c.label
                    )}
                  </span>
                  <CellIcon cell={row.cells[i]} highlight={i === 0} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-white/40">
        Comparisons reflect publicly available product information at time of writing.
        Trainerize, MyPTHub, PT Distinction and MyFitnessPal are trademarks of their
        respective owners.
      </p>
    </div>
  );
}

function CellIcon({ cell, highlight }: { cell: Cell; highlight?: boolean }) {
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
    return (
      <div className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-3 shrink-0 rounded-full bg-reps-gold" />
        <span className="text-white/65">{cell.note}</span>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      {cell.note && <span className="text-white/45">{cell.note}</span>}
    </div>
  );
}
