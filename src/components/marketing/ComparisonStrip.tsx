import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Minus } from "lucide-react";

type Row = { label: string; reps: boolean; trainerize: boolean; mypthub: boolean; ptd: boolean };

const ROWS: Row[] = [
  { label: "Public verified register", reps: true, trainerize: false, mypthub: false, ptd: false },
  { label: "AI Operating System (14 capabilities)", reps: true, trainerize: false, mypthub: false, ptd: false },
  { label: "No per-booking commission", reps: true, trainerize: true, mypthub: true, ptd: true },
  { label: "UK verified since 2009", reps: true, trainerize: false, mypthub: false, ptd: false },
  { label: "Every feature in your tier included", reps: true, trainerize: false, mypthub: false, ptd: false },
];

const COLS = ["REPs", "Trainerize", "MyPTHub", "PT Distinction"] as const;

function Cell({ on }: { on: boolean }) {
  return on ? (
    <Check className="mx-auto h-4 w-4 text-reps-orange" aria-label="Yes" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-white/30" aria-label="No" />
  );
}

export function ComparisonStrip() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-reps-border bg-reps-panel/50">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-reps-border bg-reps-panel/70">
              <th className="px-5 py-4 text-[12px] font-semibold uppercase tracking-wider text-white/55">
                What you actually get
              </th>
              {COLS.map((c, i) => (
                <th
                  key={c}
                  className={`px-5 py-4 text-center text-[12.5px] font-semibold uppercase tracking-wider ${
                    i === 0 ? "text-reps-orange" : "text-white/55"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.label} className="border-b border-reps-border/60 last:border-0">
                <td className="px-5 py-4 text-[13.5px] text-white/85">{r.label}</td>
                <td className="px-5 py-4 bg-reps-orange-soft/30"><Cell on={r.reps} /></td>
                <td className="px-5 py-4"><Cell on={r.trainerize} /></td>
                <td className="px-5 py-4"><Cell on={r.mypthub} /></td>
                <td className="px-5 py-4"><Cell on={r.ptd} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-reps-border bg-reps-panel/70 px-5 py-4 text-[12px] text-white/55">
        <div>
          Last checked: June 2026 ·{" "}
          <Link to="/comparison-methodology" className="text-reps-orange hover:underline">
            See methodology
          </Link>
        </div>
        <Link
          to="/compare"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-reps-orange hover:underline"
        >
          Full comparison <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
