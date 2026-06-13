import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "editing" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "blocked"; errorCount: number; onFix: () => void }
  | { kind: "error"; onRetry: () => void; message?: string };

/**
 * Pure auto-save status pill — the only save surface in the profile editor.
 * No companion Save button. States:
 *   idle      → hidden
 *   editing   → "Editing…" (auto-save fires in ~1.5s)
 *   saving    → spinner + "Saving…"
 *   saved     → emerald "Saved · just now" → "Saved · Nm ago"
 *   blocked   → amber "Fix N issues" button (scroll-focuses first error)
 *   error     → red "Couldn't save — retry" button
 */
export function SaveStatusPill({ status }: { status: SaveStatus }) {
  // Force a re-render every 30s so "Saved · just now" can age into "Saved · Nm ago".
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
        Editing&hellip;
      </span>
    );
  }

  if (status.kind === "saving") {
    return (
      <span className={`${common} border-reps-border bg-reps-panel-soft text-white/75`}>
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving&hellip;
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

  if (status.kind === "blocked") {
    const n = status.errorCount;
    return (
      <button
        type="button"
        onClick={status.onFix}
        className={`${common} border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25`}
      >
        <AlertTriangle className="h-3 w-3" />
        Fix {n} {n === 1 ? "issue" : "issues"}
      </button>
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
      Couldn&apos;t save &mdash; retry
    </button>
  );
}
