import { Sparkles } from "lucide-react";

import type { Competitor } from "@/data/competitor-data";
import type { Scenario } from "@/data/competitor-editorial";

export function ScenarioCards({
  c,
  scenarios,
}: {
  c: Competitor;
  scenarios: Scenario[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scenarios.map((s) => (
        <article
          key={s.persona}
          className="flex flex-col rounded-[18px] border border-reps-border bg-reps-panel p-6"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
            {s.clientCount} clients
          </div>
          <h3 className="mt-2 font-display text-[18px] font-bold leading-tight text-white">
            {s.persona}
          </h3>
          <p className="mt-1 text-[12.5px] text-white/55">{s.detail}</p>

          <div className="mt-5 space-y-2">
            <Row
              label="REPs"
              value={s.repsCost}
              isWinner={s.winner === "reps"}
              isReps
            />
            <Row
              label={c.name}
              value={s.competitorCost}
              isWinner={s.winner === "competitor"}
            />
          </div>

          <p className="mt-5 border-t border-reps-border/60 pt-4 text-[12.5px] leading-relaxed text-white/70">
            {s.summary}
          </p>
        </article>
      ))}
    </div>
  );
}

function Row({
  label,
  value,
  isWinner,
  isReps,
}: {
  label: string;
  value: string;
  isWinner?: boolean;
  isReps?: boolean;
}) {
  return (
    <div
      className={
        isReps
          ? "rounded-[12px] border border-reps-orange/40 bg-reps-orange/10 px-3 py-2.5"
          : "rounded-[12px] border border-reps-border/60 bg-reps-ink/40 px-3 py-2.5"
      }
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider ${
            isReps ? "text-reps-orange" : "text-white/55"
          }`}
        >
          {isReps ? <Sparkles className="h-3 w-3" /> : null}
          {label}
          {isWinner ? (
            <span className="ml-1 rounded-full bg-reps-orange px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white">
              Wins
            </span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 text-[13px] font-semibold text-white">{value}</div>
    </div>
  );
}
