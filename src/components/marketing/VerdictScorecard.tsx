import type { Competitor } from "@/data/competitor-data";
import type { ScorecardRow } from "@/data/competitor-editorial";

export function VerdictScorecard({
  c,
  rows,
}: {
  c: Competitor;
  rows: ScorecardRow[];
}) {
  const repsTotal = rows.reduce((a, r) => a + (r.reps * r.weight) / 5, 0);
  const compTotal = rows.reduce((a, r) => a + (r.competitor * r.weight) / 5, 0);

  return (
    <div className="overflow-clip rounded-[22px] border border-reps-border bg-reps-ink">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr className="bg-reps-panel">
              <th className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50 md:w-[40%] md:px-5">
                Criterion
              </th>
              <th className="px-3 py-4 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                Weight
              </th>
              <th className="bg-reps-orange-soft px-4 py-4 text-[13px] font-display font-bold text-reps-orange md:px-5">
                REPS
              </th>
              <th className="px-4 py-4 text-[13px] font-display font-bold text-white md:px-5">
                {c.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.criterion}
                className="[&>*]:border-t [&>*]:border-reps-border/40"
              >
                <th
                  scope="row"
                  className="bg-reps-panel/30 px-4 py-4 text-left align-top md:px-5"
                >
                  <div className="text-[13.5px] font-semibold text-white/90">
                    {r.criterion}
                  </div>
                  <div className="mt-1 text-[12px] text-white/55">{r.note}</div>
                </th>
                <td className="px-3 py-4 align-top text-[12.5px] text-white/70">
                  {r.weight}%
                </td>
                <td className="bg-reps-orange-soft/40 px-4 py-4 align-top md:px-5">
                  <ScoreBar value={r.reps} />
                </td>
                <td className="px-4 py-4 align-top md:px-5">
                  <ScoreBar value={r.competitor} muted />
                </td>
              </tr>
            ))}
            <tr className="[&>*]:border-t-2 [&>*]:border-reps-orange/30">
              <th
                scope="row"
                className="bg-reps-panel/50 px-4 py-5 text-left text-[13px] font-display font-bold uppercase tracking-wider text-white md:px-5"
              >
                Weighted total
              </th>
              <td className="bg-reps-panel/50 px-3 py-5 text-[12.5px] text-white/55">
                100%
              </td>
              <td className="bg-reps-orange/15 px-4 py-5 font-display text-[22px] font-bold text-reps-orange md:px-5">
                {repsTotal.toFixed(1)}
                <span className="text-[12px] font-normal text-white/55"> /100</span>
              </td>
              <td className="px-4 py-5 font-display text-[22px] font-bold text-white md:px-5">
                {compTotal.toFixed(1)}
                <span className="text-[12px] font-normal text-white/55"> /100</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScoreBar({ value, muted }: { value: number; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
        <div
          className={muted ? "h-full bg-white/50" : "h-full bg-reps-orange"}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className={`text-[13px] font-semibold ${muted ? "text-white/80" : "text-reps-orange"}`}>
        {value}/5
      </span>
    </div>
  );
}
