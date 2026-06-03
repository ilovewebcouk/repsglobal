import * as React from "react";
import { Check, ChevronsRight, Minus } from "lucide-react";
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

      {/* Mobile/tablet swipe hint — placed above the table so it's seen before scrolling */}
      <div className="mt-8 flex items-center gap-2 text-[12px] font-medium text-white/55 lg:hidden">
        <ChevronsRight className="h-4 w-4 text-reps-orange" aria-hidden />
        Swipe to compare other platforms
      </div>

      {/* Responsive table: sticky Feature + REPs columns on tablet/mobile, sticky header row on all breakpoints via JS-synced ghost */}
      <StickyCompareTable />





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
    return <span className="text-white/65">{cell.note}</span>;
  }
  return (
    <div className="flex items-start gap-2">
      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
      {cell.note && <span className="text-white/45">{cell.note}</span>}
    </div>
  );
}

function SharedCols() {
  // table-layout: fixed + explicit col widths guarantee header and body tables
  // align column-for-column at every breakpoint.
  return (
    <colgroup>
      <col className="w-[140px] md:w-[220px] lg:w-[28%]" />
      <col className="w-[110px] md:w-[150px] lg:w-[18%]" />
      <col className="w-[150px] md:w-[170px] lg:w-[18%]" />
      <col className="w-[150px] md:w-[170px] lg:w-[18%]" />
      <col className="w-[150px] md:w-[170px] lg:w-[18%]" />
    </colgroup>
  );
}

function StickyCompareTable() {
  const headerScrollRef = React.useRef<HTMLDivElement>(null);
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);

  const onBodyScroll = React.useCallback(() => {
    const h = headerScrollRef.current;
    const b = bodyScrollRef.current;
    if (h && b) h.scrollLeft = b.scrollLeft;
  }, []);

  return (
    <div className="mt-3 overflow-clip rounded-[22px] border border-reps-border bg-reps-ink lg:mt-10">
      {/* Sticky ghost header — pins to page viewport because the outer wrapper
          uses overflow:clip (does not create a scroll container). Its own
          overflow-x is hidden; we mirror the body's scrollLeft via JS. */}
      <div
        ref={headerScrollRef}
        className="sticky top-[72px] z-20 overflow-hidden bg-reps-panel"
        aria-hidden="true"
      >
        <table className="w-full min-w-[700px] table-fixed border-separate border-spacing-0 text-left lg:min-w-0">
          <SharedCols />
          <thead>
            <tr className="bg-reps-panel">
              <th
                scope="col"
                className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50 md:px-5"
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
                      ? "bg-reps-orange-tint text-reps-orange lg:bg-reps-orange-soft"
                      : "text-white/80",
                  ].join(" ")}
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
        </table>
      </div>

      {/* Body table — horizontally scrollable on mobile/tablet, full width on desktop. */}
      <div
        ref={bodyScrollRef}
        onScroll={onBodyScroll}
        className="overflow-x-auto [overflow-y:clip] lg:overflow-visible"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <table className="w-full min-w-[700px] table-fixed border-separate border-spacing-0 text-left lg:min-w-0">
          <SharedCols />
          {/* Visually-hidden header for accessibility & layout parity (kept in DOM
              so screen readers reach a <thead> inside the data table). */}
          <thead className="sr-only">
            <tr>
              <th scope="col">Feature</th>
              {COLS.map((c) => (
                <th key={c.label} scope="col">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
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
  );
}
