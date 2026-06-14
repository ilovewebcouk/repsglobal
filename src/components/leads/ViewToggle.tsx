import * as React from "react";
import { LayoutGrid, Rows3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type LeadsView = "table" | "kanban";

export function ViewToggle({ value, onChange }: { value: LeadsView; onChange: (v: LeadsView) => void }) {
  return (
    <div
      role="tablist"
      aria-label="Pipeline view"
      className="inline-flex items-center rounded-[10px] border border-reps-border bg-reps-panel-soft p-0.5"
    >
      <Btn active={value === "table"} onClick={() => onChange("table")} label="Table view">
        <Rows3 className="size-3.5" />
        <span className="ml-1.5">Table</span>
      </Btn>
      <Btn active={value === "kanban"} onClick={() => onChange("kanban")} label="Kanban view">
        <LayoutGrid className="size-3.5" />
        <span className="ml-1.5">Kanban</span>
      </Btn>
    </div>
  );
}

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center rounded-[8px] px-3 text-[12px] font-semibold transition-colors",
        active ? "bg-reps-panel text-white shadow-none" : "text-white/55 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
