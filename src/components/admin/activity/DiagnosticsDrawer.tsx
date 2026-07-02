// Diagnostics drawer — collapses developer/ops maintenance out of the owner view.
// Holds: geo backfill button, ingest health, pipeline notes.

import { useCallback, useState } from "react";
import { ChevronDown, Wrench } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runGeoBackfill } from "@/lib/ops/backfill-geo.functions";

export interface DiagnosticsDrawerProps {
  ingestStatus: "healthy" | "degraded" | "down";
  degradedPanels: string[];
  slowPanels: Array<{ panel: string; ms: number }>;
  lastJourneyAt?: string | null;
  publicOnline: number;
  membersOnline: number;
}

export function DiagnosticsDrawer({
  ingestStatus, degradedPanels, slowPanels,
  lastJourneyAt, publicOnline, membersOnline,
}: DiagnosticsDrawerProps) {
  const [open, setOpen] = useState(false);
  const dot =
    ingestStatus === "healthy" ? "bg-emerald-400" :
    ingestStatus === "degraded" ? "bg-amber-400" : "bg-red-400";

  return (
    <section className="overflow-hidden rounded-[18px] border border-reps-border bg-reps-panel/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 text-[12.5px] font-medium text-white/75">
          <Wrench className="h-3.5 w-3.5 text-white/45" />
          Diagnostics
          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10.5px] text-white/55">
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
            {ingestStatus}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 text-white/45 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-reps-border/70 px-4 py-3">
          <div className="grid grid-cols-2 gap-3 text-[11.5px] text-white/70 md:grid-cols-4">
            <Stat label="Public online" value={String(publicOnline)} />
            <Stat label="Members online" value={String(membersOnline)} />
            <Stat label="Last event" value={lastJourneyAt ? new Date(lastJourneyAt).toLocaleTimeString() : "—"} />
            <Stat label="Slow panels" value={String(slowPanels.length)} />
          </div>

          {degradedPanels.length > 0 ? (
            <div className="rounded-[10px] border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
              Degraded: {degradedPanels.join(", ")}
            </div>
          ) : null}

          {slowPanels.length > 0 ? (
            <div className="text-[10.5px] text-white/50">
              Slow: {slowPanels.map((s) => `${s.panel} (${s.ms}ms)`).join(" · ")}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <BackfillGeoInline />
            <span className="text-[10.5px] text-white/40">Consent-gated · country-level enrichment · no raw IPs</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] border border-reps-border/50 bg-white/[0.02] px-2.5 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-white/40">{label}</span>
      <span className="font-medium text-white/85 tabular-nums">{value}</span>
    </div>
  );
}

function BackfillGeoInline() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = useServerFn(runGeoBackfill);
  const onClick = useCallback(async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await run({ data: { days: 30 } });
      setMsg(`ok · ${r.rows_updated} updated · ${r.cache_hits} cache hits`);
    } catch (e) {
      setMsg("failed");
      console.error(e);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(null), 8000);
    }
  }, [run]);
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={onClick} disabled={busy}>
        {busy ? "Refreshing geo…" : "Refresh location data"}
      </Button>
      {msg ? <span className="text-[10.5px] text-white/55">{msg}</span> : null}
    </div>
  );
}
