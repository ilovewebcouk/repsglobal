// Analytics strip — 5 tiles with 7-day sparklines and deltas vs prior period.
// Purely presentational: parent supplies pre-aggregated series.

import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

export interface AnalyticsSeries {
  label: string;
  value: string | number;
  series: number[]; // 7 days, oldest → newest
  color?: string;
  format?: (n: number) => string;
}

export interface AnalyticsStripProps {
  tiles: AnalyticsSeries[];
}

function Delta({ series }: { series: number[] }) {
  if (series.length < 2) return null;
  const mid = Math.floor(series.length / 2);
  const prev = series.slice(0, mid).reduce((s, n) => s + n, 0);
  const now = series.slice(mid).reduce((s, n) => s + n, 0);
  if (prev === 0 && now === 0) {
    return <span className="inline-flex items-center gap-0.5 text-[10.5px] text-white/40"><Minus className="h-2.5 w-2.5" /> flat</span>;
  }
  if (prev === 0) return <span className="text-[10.5px] text-emerald-300">new</span>;
  const pct = ((now - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10.5px] font-medium ${up ? "text-emerald-300" : "text-red-300"}`}>
      {up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function AnalyticsStrip({ tiles }: AnalyticsStripProps) {
  return (
    <section className="grid grid-cols-2 gap-2 rounded-[18px] border border-reps-border bg-reps-panel p-3 md:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <Tile key={t.label} tile={t} />
      ))}
    </section>
  );
}

function Tile({ tile }: { tile: AnalyticsSeries }) {
  const color = tile.color ?? "#F97316";
  const data = useMemo(() => tile.series.map((v, i) => ({ i, v })), [tile.series]);
  return (
    <div className="flex flex-col gap-1.5 rounded-[12px] border border-reps-border/60 bg-white/[0.03] px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10.5px] font-medium uppercase tracking-wide text-white/50">{tile.label}</span>
        <Delta series={tile.series} />
      </div>
      <div className="font-display text-[22px] font-semibold leading-none text-white tabular-nums">
        {typeof tile.value === "number" && tile.format ? tile.format(tile.value) : tile.value}
      </div>
      <div className="h-8 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
