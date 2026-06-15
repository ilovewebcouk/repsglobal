import { useEffect } from "react";
import { Check, RotateCcw, Clock, Trash2, X, Loader2 } from "lucide-react";

type Props = {
  count: number;
  onClear: () => void;
  onResolve: () => void;
  onReopen: () => void;
  onPending: () => void;
  onDelete: () => void;
  isPending: boolean;
};

/**
 * Bottom-center floating pill bar (Linear/Notion style).
 * Appears when ≥1 ticket is selected; Esc clears selection.
 */
export function BulkActionBar({
  count,
  onClear,
  onResolve,
  onReopen,
  onPending,
  onDelete,
  isPending,
}: Props) {
  useEffect(() => {
    if (count === 0) return;
    function onKey(e: KeyboardEvent) {
      // Ignore when typing in inputs
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (e.key === "Escape") onClear();
      else if (e.key.toLowerCase() === "e") onResolve();
      else if (e.key.toLowerCase() === "r") onReopen();
      else if (e.key.toLowerCase() === "p") onPending();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [count, onClear, onResolve, onReopen, onPending]);

  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="pointer-events-auto inline-flex items-center gap-1 rounded-full border border-white/15 bg-[#161616]/95 px-2 py-1.5 text-[12.5px] text-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-white/85">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          <span className="font-semibold tabular-nums">{count}</span>
          <span className="text-white/55">selected</span>
        </div>

        <span className="mx-0.5 h-4 w-px bg-white/10" />

        <PillButton onClick={onResolve} disabled={isPending} title="Resolve (E)">
          <Check className="size-3.5 text-emerald-300" />
          Resolve
        </PillButton>
        <PillButton onClick={onPending} disabled={isPending} title="Mark pending (P)">
          <Clock className="size-3.5 text-reps-orange" />
          Pending
        </PillButton>
        <PillButton onClick={onReopen} disabled={isPending} title="Reopen (R)">
          <RotateCcw className="size-3.5 text-white/70" />
          Reopen
        </PillButton>

        <span className="mx-0.5 h-4 w-px bg-white/10" />

        <PillButton onClick={onDelete} disabled={isPending} danger title="Delete">
          <Trash2 className="size-3.5" />
          Delete
        </PillButton>

        <span className="mx-0.5 h-4 w-px bg-white/10" />

        <button
          type="button"
          onClick={onClear}
          disabled={isPending}
          title="Clear selection (Esc)"
          className="inline-flex items-center justify-center rounded-full p-1.5 text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function PillButton({
  onClick,
  disabled,
  children,
  title,
  danger,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? "text-rose-300 hover:bg-rose-500/15 hover:text-rose-200"
          : "text-white/85 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
