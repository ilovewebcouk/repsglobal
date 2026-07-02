// Compact status strip — build contract §10.
// Exactly 6 tiles: Live now, Public now, Members now, Key actions, Action queue, Health.
// Owner-facing copy only — no ingest/linker/rollup jargon.

import { cn } from "@/lib/utils";

export type HealthState = "healthy" | "degraded" | "broken";

export interface CompactStatusStripProps {
  publicLive: number;
  membersLive: number;
  keyActionsToday: number;
  criticalCount: number;
  warningCount: number;
  health: HealthState;
}

interface Tile {
  label: string;
  value: string | number;
  sub: string;
  tone?: "default" | "accent" | "warn" | "critical" | "ok";
}

function toneClasses(tone: Tile["tone"]) {
  switch (tone) {
    case "accent": return "text-orange-300";
    case "critical": return "text-red-400";
    case "warn": return "text-amber-300";
    case "ok": return "text-emerald-300";
    default: return "text-white";
  }
}

export function CompactStatusStrip(props: CompactStatusStripProps) {
  const liveNow = props.publicLive + props.membersLive;
  const healthLabel = props.health === "healthy" ? "Healthy" : props.health === "degraded" ? "Degraded" : "Action needed";
  const healthTone: Tile["tone"] = props.health === "healthy" ? "ok" : props.health === "degraded" ? "warn" : "critical";

  const tiles: Tile[] = [
    { label: "Live now", value: liveNow, sub: `${props.publicLive} public · ${props.membersLive} members`, tone: liveNow > 0 ? "accent" : "default" },
    { label: "Public now", value: props.publicLive, sub: "anonymous · live" },
    { label: "Members now", value: props.membersLive, sub: "logged in · live" },
    { label: "Key actions", value: props.keyActionsToday, sub: "today · enquiries + signups" },
    {
      label: "Action queue",
      value: props.criticalCount + props.warningCount,
      sub: `${props.criticalCount} critical · ${props.warningCount} warnings`,
      tone: props.criticalCount > 0 ? "critical" : props.warningCount > 0 ? "warn" : "default",
    },
    { label: "Health", value: healthLabel, sub: props.health === "healthy" ? "all systems live" : "see diagnostics", tone: healthTone },
  ];

  return (
    <section
      aria-label="Command status"
      className="grid grid-cols-2 gap-2 rounded-[14px] border border-reps-border bg-reps-panel/60 p-2 sm:grid-cols-3 xl:grid-cols-6"
    >
      {tiles.map((t) => (
        <div key={t.label} className="rounded-[10px] bg-white/[0.03] px-3 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-white/45">{t.label}</div>
          <div className={cn("mt-0.5 font-display text-[22px] font-semibold leading-none", toneClasses(t.tone))}>
            {t.value}
          </div>
          <div className="mt-1 text-[10.5px] text-white/55">{t.sub}</div>
        </div>
      ))}
    </section>
  );
}
