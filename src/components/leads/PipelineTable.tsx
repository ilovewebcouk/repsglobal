import * as React from "react";
import { Mail, Phone, MoreHorizontal, CheckCheck, Archive, ShieldAlert } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LEAD_STAGE_LABEL, type LeadDTO, type LeadStage } from "@/lib/leads/leads.functions";
import { updateEnquiryStatus } from "@/lib/enquiries/enquiries.functions";
import { sourceLabel } from "./SourceChipsRow";

function fmtMoney(p: number | null) {
  if (!p) return "—";
  return "£" + Math.round(p / 100).toLocaleString();
}

function followUpText(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff > 0 && diff < 14) return `${diff} days`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function stagePillClasses(stage: LeadStage): string {
  switch (stage) {
    case "new":
      return "border-reps-orange-border/40 bg-reps-orange-soft text-reps-orange";
    case "call_booked":
      return "border-sky-400/30 bg-sky-500/15 text-sky-300";
    case "proposal_sent":
      return "border-violet-400/30 bg-violet-500/15 text-violet-300";
    case "trial_booked":
      return "border-amber-400/30 bg-amber-500/15 text-amber-300";
    case "converted":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
    case "lost":
      return "border-reps-border bg-reps-panel-soft text-white/55";
    case "contacted":
      return "border-reps-border bg-reps-panel-soft text-white/70";
  }
}

function priorityPillClasses(p: LeadDTO["priority"], score: number | null): string {
  const eff: "high" | "medium" | "low" =
    p ?? (score === null ? "low" : score >= 80 ? "high" : score >= 40 ? "medium" : "low");
  if (eff === "high") return "border-reps-orange-border/40 bg-reps-orange-soft text-reps-orange";
  if (eff === "medium") return "border-reps-border bg-reps-panel-soft text-white/85";
  return "border-reps-border bg-reps-panel-soft text-white/55";
}

function effectivePriority(p: LeadDTO["priority"], score: number | null): string {
  const eff = p ?? (score === null ? "low" : score >= 80 ? "high" : score >= 40 ? "medium" : "low");
  return eff.charAt(0).toUpperCase() + eff.slice(1);
}

function RowActions({ lead }: { lead: LeadDTO }) {
  const setStatus = useServerFn(updateEnquiryStatus);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: (status: LeadDTO["status"]) => setStatus({ data: { id: lead.id, status } }),
    onSuccess: (_d, status) => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
      if (status === "replied") toast.success("Marked as replied");
      else if (status === "archived") toast.success("Archived");
      else if (status === "spam") toast.success("Marked as spam");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update"),
  });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
          aria-label="More"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-reps-border bg-reps-ink text-white">
        <DropdownMenuItem
          className="text-[12.5px] text-white focus:bg-reps-panel-soft focus:text-white"
          onClick={() => mut.mutate("replied")}
          disabled={mut.isPending || lead.status === "replied"}
        >
          <CheckCheck className="mr-2 size-3.5" />
          Mark as replied
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-[12.5px] text-white focus:bg-reps-panel-soft focus:text-white"
          onClick={() => mut.mutate("archived")}
          disabled={mut.isPending}
        >
          <Archive className="mr-2 size-3.5" />
          Archive
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-reps-border" />
        <DropdownMenuItem
          className="text-[12.5px] text-red-300 focus:bg-red-500/10 focus:text-red-200"
          onClick={() => mut.mutate("spam")}
          disabled={mut.isPending}
        >
          <ShieldAlert className="mr-2 size-3.5" />
          Mark as spam
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PipelineTable({
  leads,
  selectedId,
  onSelect,
  selectedIds,
  onToggle,
  onToggleAll,
}: {
  leads: LeadDTO[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}) {
  const allChecked = leads.length > 0 && leads.every((l) => selectedIds.has(l.id));

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="grid min-w-[920px] grid-cols-[28px_2fr_1.2fr_1fr_0.9fr_0.7fr_0.8fr_0.7fr_0.7fr] items-center gap-3 border-b border-reps-border/60 px-4 py-2.5">
        <Checkbox
          aria-label="Select all"
          checked={allChecked}
          onCheckedChange={(c) => onToggleAll(!!c)}
        />
        <Th>Lead</Th>
        <Th>Goal</Th>
        <Th>Source</Th>
        <Th>Status</Th>
        <Th className="text-right">Est. value</Th>
        <Th>Follow-up</Th>
        <Th>Priority</Th>
        <Th className="text-right">Actions</Th>
      </div>

      {/* Rows */}
      <div>
        {leads.length === 0 ? (
          <div className="px-4 py-12 text-center text-[12.5px] text-white/45">
            No leads match these filters.
          </div>
        ) : (
          leads.map((l) => {
            const isActive = l.id === selectedId;
            const checked = selectedIds.has(l.id);
            return (
              <div
                key={l.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(l.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(l.id);
                  }
                }}
                className={cn(
                  "grid min-w-[920px] cursor-pointer grid-cols-[28px_2fr_1.2fr_1fr_0.9fr_0.7fr_0.8fr_0.7fr_0.7fr] items-center gap-3 border-b border-reps-border/40 px-4 py-3.5 text-left text-[12.5px] transition-colors",
                  isActive ? "bg-reps-orange-soft/15" : "hover:bg-reps-panel-soft/50",
                )}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggle(l.id)}
                    aria-label={`Select ${l.sender_name}`}
                  />
                </div>

                {/* Lead */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[10.5px] font-bold text-reps-orange">
                    {initials(l.sender_name)}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{l.sender_name}</div>
                    <div className="truncate text-[11px] text-white/45">
                      Lead · {sourceLabel(l.source)}
                    </div>
                  </div>
                </div>

                {/* Goal */}
                <div className="truncate text-white/85">
                  {l.goals[0] ?? l.service_title ?? "—"}
                </div>

                {/* Source */}
                <div className="truncate text-white/70">{sourceLabel(l.source)}</div>

                {/* Status pill */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-[6px] border px-2 py-1 text-[10.5px] font-semibold",
                      stagePillClasses(l.stage),
                    )}
                  >
                    {LEAD_STAGE_LABEL[l.stage]}
                  </span>
                </div>

                {/* Est. value */}
                <div className="text-right font-semibold text-white">{fmtMoney(l.estimated_value_pence)}</div>

                {/* Follow-up */}
                <div className="text-white/70">{followUpText(l.follow_up_at)}</div>

                {/* Priority */}
                <div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-[6px] border px-2 py-1 text-[10.5px] font-semibold",
                      priorityPillClasses(l.priority, l.ai_score),
                    )}
                  >
                    {effectivePriority(l.priority, l.ai_score)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={`mailto:${l.sender_email}`}
                    className="grid size-7 place-items-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
                    aria-label="Email"
                  >
                    <Mail className="size-3.5" />
                  </a>
                  {l.sender_phone ? (
                    <a
                      href={`tel:${l.sender_phone}`}
                      className="grid size-7 place-items-center rounded-[8px] border border-reps-border bg-reps-panel-soft text-white/70 hover:text-white"
                      aria-label="Call"
                    >
                      <Phone className="size-3.5" />
                    </a>
                  ) : (
                    <span className="grid size-7 place-items-center rounded-[8px] border border-reps-border/60 bg-reps-panel-soft/60 text-white/30">
                      <Phone className="size-3.5" />
                    </span>
                  )}
                  <RowActions lead={l} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/55", className)}>
      {children}
    </span>
  );
}
