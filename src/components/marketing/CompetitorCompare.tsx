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
