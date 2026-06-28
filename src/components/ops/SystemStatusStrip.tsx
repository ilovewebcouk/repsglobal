import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSystemStatus, type StatusTone } from "@/lib/ops/system-status.functions";

const TONE_CLASS: Record<StatusTone, string> = {
  green: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  amber: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  red:   "border-rose-500/40 bg-rose-500/10 text-rose-100",
};
const DOT_CLASS: Record<StatusTone, string> = {
  green: "bg-emerald-400",
  amber: "bg-amber-400",
  red:   "bg-rose-400",
};

export function SystemStatusStrip() {
  const fn = useServerFn(getSystemStatus);
  const q = useQuery({
    queryKey: ["ops-system-status"],
    queryFn: () => fn(),
    refetchInterval: 60_000,
  });
  const tiles = q.data?.tiles ?? [];

  if (tiles.length === 0) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-[16px] border border-reps-border bg-reps-panel/40"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {tiles.map((t) => (
        <Link
          key={t.key}
          to={t.href}
          className={`block rounded-[16px] border p-4 transition hover:brightness-110 ${TONE_CLASS[t.tone]}`}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide opacity-80">
            <span className={`inline-block size-2 rounded-full ${DOT_CLASS[t.tone]}`} />
            {t.label}
          </div>
          <div className="mt-1 text-base font-semibold">
            {t.tone === "green" ? "Healthy" : t.tone === "amber" ? "Degraded" : "Issue"}
          </div>
          <div className="text-xs opacity-75">{t.detail}</div>
        </Link>
      ))}
    </div>
  );
}
