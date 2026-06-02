import * as React from "react";
import { Check, Minus } from "lucide-react";

type Cell =
  | { kind: "yes"; note?: string }
  | { kind: "partial"; note: string }
  | { kind: "no"; note?: string };

const COLS = ["REPs", "Trainerize", "MyPTHub", "PT Distinction"] as const;

const ROWS: { feature: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  {
    feature: "Public directory that brings you clients",
    cells: [
      { kind: "yes", note: "Searched by the public daily" },
      { kind: "no", note: "Bring your own clients" },
      { kind: "no", note: "Bring your own clients" },
      { kind: "no", note: "Bring your own clients" },
    ],
  },
  {
    feature: "Industry-recognised credential",
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
    feature: "CPD tracking on profile",
    cells: [
      { kind: "yes" },
      { kind: "no" },
      { kind: "no" },
      { kind: "no" },
    ],
  },
  {
    feature: "Bookings & Stripe payments",
    cells: [
      { kind: "yes", note: "Deposits, subs, payouts" },
      { kind: "partial", note: "Payments only" },
      { kind: "yes" },
      { kind: "partial", note: "Add-on" },
    ],
  },
  {
    feature: "Programme builder + video library",
    cells: [
      { kind: "yes" },
      { kind: "yes" },
      { kind: "yes" },
      { kind: "yes" },
    ],
  },
  {
    feature: "Branded client portal",
    cells: [
      { kind: "yes" },
      { kind: "yes", note: "App-only, Trainerize-branded" },
      { kind: "partial", note: "Web portal" },
      { kind: "yes" },
    ],
  },
  {
    feature: "Reviews on the public record",
    cells: [
      { kind: "yes" },
      { kind: "no" },
      { kind: "no" },
      { kind: "no" },
    ],
  },
];

export function CompetitorCompare() {
  return (
    <div>
      <div className="max-w-[720px]">
        <span className="text-[12px] font-semibold uppercase tracking-wider text-reps-orange">
          The honest comparison
        </span>
        <h2 className="mt-2 font-display text-[32px] font-bold leading-tight text-white lg:text-[42px]">
          REPs vs the coaching apps.
        </h2>
        <p className="mt-3 max-w-[600px] text-[15px] text-white/65">
          Most coaching apps assume you already have clients. REPs is the only one that
          brings them too — on top of every tool you'd expect.
        </p>
      </div>

      {/* Desktop / tablet table */}
      <div className="mt-10 hidden overflow-hidden rounded-[22px] border border-reps-border md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-reps-panel/80">
              <th
                scope="col"
                className="w-[34%] px-5 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50"
              >
                Feature
              </th>
              {COLS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-5 py-4 text-[13px] font-display font-bold ${
                    i === 0 ? "bg-reps-orange-soft text-reps-orange" : "text-white/80"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, ri) => (
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
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked per-row cards */}
      <div className="mt-8 grid gap-4 md:hidden">
        {ROWS.map((row) => (
          <div
            key={row.feature}
            className="rounded-[16px] border border-reps-border bg-reps-panel p-4"
          >
            <div className="text-[13.5px] font-semibold text-white">{row.feature}</div>
            <ul className="mt-3 space-y-2">
              {COLS.map((c, i) => (
                <li
                  key={c}
                  className={`flex items-start gap-2 rounded-[10px] px-3 py-2 ${
                    i === 0 ? "bg-reps-orange-soft" : "bg-reps-ink/40"
                  }`}
                >
                  <span
                    className={`min-w-[88px] text-[11px] font-semibold uppercase tracking-wider ${
                      i === 0 ? "text-reps-orange" : "text-white/55"
                    }`}
                  >
                    {c}
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
        Trainerize, MyPTHub and PT Distinction are trademarks of their respective owners.
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
