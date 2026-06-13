import * as React from "react";
import { Loader2 } from "lucide-react";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; onRetry: () => void; message?: string };

/**
 * Compact status pill rendered next to the manual Save button. Mirrors the
 * Notion / Linear / Stripe Dashboard auto-save pattern.
 */
export function SaveStatusPill({ status }: { status: SaveStatus }) {
  // Force a re-render every 30s so "Saved · just now" can age into "Saved".
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (status.kind !== "saved") return;
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, [status.kind]);

  if (status.kind === "idle") return null;

  const common =
    "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] font-medium";

  if (status.kind === "editing") {
    return (
      <span className={`${common} border-reps-border bg-reps-panel-soft text-white/65`}>
        <span className="inline-block size-1.5 rounded-full bg-white/55" />
        Unsaved changes
      </span>
    );
  }

  if (status.kind === "saving") {
    return (
      <span className={`${common} border-reps-border bg-reps-panel-soft text-white/75`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </span>
    );
  }

  if (status.kind === "saved") {
    const ageMs = Date.now() - status.at;
    const label = ageMs < 60_000 ? "Saved · just now" : `Saved · ${Math.floor(ageMs / 60_000)}m ago`;
    return (
      <span className={`${common} border-emerald-400/30 bg-emerald-500/15 text-emerald-300`}>
        <span className="inline-block size-1.5 rounded-full bg-emerald-400" />
        {label}
      </span>
    );
  }

  // error
  return (
    <button
      type="button"
      onClick={status.onRetry}
      className={`${common} border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25`}
    >
      <span className="inline-block size-1.5 rounded-full bg-red-400" />
      Couldn&apos;t save — retry
    </button>
  );
}
