import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Archive, Mail, Calendar, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABEL,
  bulkSetStage,
  type LeadStage,
} from "@/lib/leads/leads.functions";

export function BulkActionBar({
  selectedIds,
  onClear,
}: {
  selectedIds: Set<string>;
  onClear: () => void;
}) {
  const qc = useQueryClient();
  const count = selectedIds.size;
  const ids = React.useMemo(() => Array.from(selectedIds), [selectedIds]);

  const stageMut = useMutation({
    mutationFn: (stage: LeadStage) => bulkSetStage({ data: { ids, stage } }),
    onSuccess: (r) => {
      toast.success(`Moved ${r.count} lead${r.count === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      onClear();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't move leads"),
  });

  const archiveMut = useMutation({
    mutationFn: () => bulkSetStage({ data: { ids, stage: "lost" as LeadStage } }),
    onSuccess: () => {
      toast.success(`Archived ${ids.length} lead${ids.length === 1 ? "" : "s"}`);
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      onClear();
    },
  });

  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[12px] border border-reps-orange-border/40 bg-reps-orange-soft/15 px-3 py-2">
      <span className="text-[12px] font-semibold text-white">
        {count} selected
      </span>
      <span className="mx-1 h-4 w-px bg-reps-border" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[12px]">
            Move to stage… <ChevronDown className="ml-1 size-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {LEAD_STAGES.map((s) => (
            <DropdownMenuItem key={s} onSelect={() => stageMut.mutate(s)}>
              {LEAD_STAGE_LABEL[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="sm"
                variant="outline"
                disabled
                className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[12px] opacity-60"
              >
                <Mail className="size-3.5" /> <span className="ml-1.5">Send sequence</span>
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>Coming in Phase 2.1</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        size="sm"
        variant="outline"
        disabled
        className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[12px] opacity-60"
      >
        <Calendar className="size-3.5" /> <span className="ml-1.5">Assign follow-up</span>
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => archiveMut.mutate()}
        className="h-8 rounded-[10px] border-reps-border bg-reps-panel text-[12px] text-white/85 transition-colors hover:bg-reps-panel-soft hover:text-white"
      >
        <Archive className="size-3.5" /> <span className="ml-1.5">Archive</span>
      </Button>

      <Button
        size="sm"
        variant="ghost"
        onClick={onClear}
        className="ml-auto h-8 rounded-[10px] text-[12px] text-white/55 hover:text-white"
      >
        <X className="size-3.5" /> <span className="ml-1">Clear</span>
      </Button>
    </div>
  );
}
