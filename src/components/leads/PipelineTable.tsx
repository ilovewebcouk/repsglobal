import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABEL,
  type LeadDTO,
  type LeadStage,
} from "@/lib/leads/leads.functions";

function bandDot(band: LeadDTO["ai_band"]) {
  if (band === "hot") return "bg-reps-orange";
  if (band === "warm") return "bg-emerald-400";
  if (band === "cold") return "bg-white/35";
  return "bg-white/20";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function fmtMoney(pence: number | null) {
  if (!pence) return "—";
  return "£" + (pence / 100).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function PipelineTable({
  leads,
  selectedId,
  onSelect,
  stageFilter,
  onStageFilterChange,
  sourceFilter,
  onSourceFilterChange,
}: {
  leads: LeadDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  stageFilter: LeadStage | "all";
  onStageFilterChange: (v: LeadStage | "all") => void;
  sourceFilter: string;
  onSourceFilterChange: (v: string) => void;
}) {
  const [sortKey, setSortKey] = React.useState<"created_at" | "ai_score" | "estimated_value_pence">("ai_score");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");

  const sources = React.useMemo(() => {
    const s = new Set<string>();
    for (const l of leads) s.add(l.source);
    return ["all", ...Array.from(s).sort()];
  }, [leads]);

  const filtered = React.useMemo(() => {
    let out = leads;
    if (stageFilter !== "all") out = out.filter((l) => l.stage === stageFilter);
    if (sourceFilter !== "all") out = out.filter((l) => l.source === sourceFilter);
    out = [...out].sort((a, b) => {
      const av = (a[sortKey] ?? 0) as number | string;
      const bv = (b[sortKey] ?? 0) as number | string;
      if (sortKey === "created_at") {
        const at = new Date(a.created_at).getTime();
        const bt = new Date(b.created_at).getTime();
        return sortDir === "asc" ? at - bt : bt - at;
      }
      return sortDir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return out;
  }, [leads, stageFilter, sourceFilter, sortKey, sortDir]);

  const SortHead = ({
    label,
    k,
    className,
  }: { label: string; k: typeof sortKey; className?: string }) => (
    <button
      type="button"
      onClick={() => {
        if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
        else { setSortKey(k); setSortDir("desc"); }
      }}
      className={cn(
        "flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-white/55 hover:text-white",
        className,
      )}
    >
      {label}
      {sortKey === k ? (
        sortDir === "desc" ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />
      ) : null}
    </button>
  );

  return (
    <div className="flex flex-col">
      {/* Filter pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-reps-border/60 px-4 py-3">
        <button
          type="button"
          onClick={() => onStageFilterChange("all")}
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
            stageFilter === "all"
              ? "bg-reps-orange-soft text-reps-orange"
              : "bg-reps-panel-soft text-white/60 hover:text-white",
          )}
        >
          All
        </button>
        {LEAD_STAGES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onStageFilterChange(s)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors",
              stageFilter === s
                ? "bg-reps-orange-soft text-reps-orange"
                : "bg-reps-panel-soft text-white/60 hover:text-white",
            )}
          >
            {LEAD_STAGE_LABEL[s]}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[10.5px] uppercase tracking-wider text-white/45">Source:</span>
          {sources.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onSourceFilterChange(src)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                sourceFilter === src
                  ? "bg-reps-panel text-white"
                  : "text-white/55 hover:text-white",
              )}
            >
              {src === "all" ? "All" : src.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1.7fr_1fr_0.7fr_0.6fr_0.6fr_0.8fr] gap-3 border-b border-reps-border/60 px-4 py-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">Lead</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">Goal</span>
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">Stage</span>
        <SortHead label="Score" k="ai_score" />
        <SortHead label="Value" k="estimated_value_pence" />
        <SortHead label="Created" k="created_at" />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12.5px] text-white/45">
            No leads match these filters.
          </div>
        ) : (
          filtered.map((l) => {
            const isActive = l.id === selectedId;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onSelect(l.id)}
                className={cn(
                  "grid w-full grid-cols-[1.7fr_1fr_0.7fr_0.6fr_0.6fr_0.8fr] items-center gap-3 border-b border-reps-border/40 px-4 py-3 text-left text-[12.5px] transition-colors",
                  isActive ? "bg-reps-panel-soft" : "hover:bg-reps-panel-soft/60",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("size-1.5 shrink-0 rounded-full", bandDot(l.ai_band))} />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{l.sender_name}</div>
                    <div className="truncate text-[11px] text-white/45">{l.sender_email}</div>
                  </div>
                </div>
                <div className="truncate text-white/70">{l.goals[0] ?? l.service_title ?? "—"}</div>
                <div>
                  <Badge variant="outline" className="rounded-full border-reps-border bg-reps-panel-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                    {LEAD_STAGE_LABEL[l.stage]}
                  </Badge>
                </div>
                <div className={cn("font-semibold", l.ai_score === null ? "text-white/40" : l.ai_score >= 80 ? "text-reps-orange" : l.ai_score >= 40 ? "text-emerald-300" : "text-white/70")}>
                  {l.ai_score ?? "—"}
                </div>
                <div className="text-white/70">{fmtMoney(l.estimated_value_pence)}</div>
                <div className="text-white/55">{fmtTime(l.created_at)}</div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
