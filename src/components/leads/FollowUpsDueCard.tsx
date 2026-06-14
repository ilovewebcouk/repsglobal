import * as React from "react";
import { Button } from "@/components/ui/button";
import type { LeadKpis } from "@/lib/leads/leads.functions";

function initials(name: string) {
  return name.split(/\s+/).map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function FollowUpsDueCard({
  kpis,
  onOpen,
}: {
  kpis: LeadKpis | undefined;
  onOpen: (id: string) => void;
}) {
  const list = kpis?.follow_ups_due_list ?? [];
  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel p-5">
      <div className="font-display text-[15.5px] font-bold text-white">Follow-ups due</div>
      <div className="mt-0.5 text-[11.5px] text-white/55">Next 48 hours</div>

      <div className="mt-4 flex flex-col gap-2.5">
        {list.length === 0 ? (
          <p className="text-[12.5px] text-white/45">No follow-ups due in the next 48 hours.</p>
        ) : (
          list.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-[14px] border border-reps-border/60 bg-reps-panel-soft px-3 py-2.5"
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[10.5px] font-bold text-reps-orange">
                {initials(f.name)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-white">{f.name}</div>
                <div className="text-[11px] text-white/55">{f.when}</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onOpen(f.id)}
                className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[11.5px] text-white shadow-none hover:bg-reps-panel-soft"
              >
                Open
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
