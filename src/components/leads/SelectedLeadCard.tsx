import * as React from "react";
import { MapPin, Calendar, MessageSquare, FileText, UserCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { type LeadDTO, updateLead } from "@/lib/leads/leads.functions";
import { sourceLabel } from "./SourceChipsRow";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { timeAgo } from "@/lib/format/relative-time";
import { cn } from "@/lib/utils";

function followUpLabel(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";
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

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
      <span className="text-white/55">{label}</span>
      <span className="truncate text-right font-medium text-white/90">{value}</span>
    </div>
  );
}

export function SelectedLeadCard({
  lead,
  variant = "panel",
}: {
  lead: LeadDTO;
  /** "panel" = standalone bordered card (rail). "sheet" = embedded inside SheetContent (no outer chrome). */
  variant?: "panel" | "sheet";
}) {
  const qc = useQueryClient();
  const isConverted = lead.stage === "converted";

  const convertMut = useMutation({
    mutationFn: () => updateLead({ data: { id: lead.id, stage: "converted" } }),
    onSuccess: () => {
      toast.success("Lead converted");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });

  return (
    <div
      className={cn(
        variant === "panel"
          ? "rounded-[18px] border border-reps-border bg-reps-panel p-5"
          : "rounded-[18px] border border-reps-border/50 bg-reps-panel/60 p-4",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
          {initials(lead.sender_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[17px] font-bold text-white">{lead.sender_name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-semibold",
                isConverted
                  ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-300"
                  : "border-reps-orange-border/40 bg-reps-orange-soft text-reps-orange",
              )}
            >
              {isConverted ? "Converted" : lead.stage === "new" ? "New lead" : "Active lead"}
            </Badge>
            {lead.location ? (
              <span className="inline-flex items-center gap-1 text-[11.5px] text-white/55">
                <MapPin className="size-3" /> {lead.location}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Field list */}
      <div className="mt-5 flex flex-col gap-2.5">
        <Row label="Source" value={sourceLabel(lead.source)} />
        <Row label="Goal" value={lead.goals[0] ?? lead.service_title ?? "—"} />
        <Row
          label="Estimated value"
          value={lead.estimated_value_pence ? "£" + Math.round(lead.estimated_value_pence / 100).toLocaleString() : "—"}
        />
        {lead.frequency ? <Row label="Preferred format" value={lead.frequency} /> : null}
        {lead.location ? <Row label="Location" value={lead.location} /> : null}
        <Row label="Last activity" value={`Enquired ${timeAgo(lead.created_at)}`} />
        <Row label="Follow-up due" value={followUpLabel(lead.follow_up_at)} />
      </div>

      {/* Message */}
      <div className="mt-5 rounded-[16px] border border-reps-border/60 bg-reps-panel-soft px-4 py-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-white/45">
          Lead message
        </div>
        <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-white/85">
          &ldquo;{lead.message}&rdquo;
        </p>
      </div>

      {/* Actions: 2x2 grid */}
      <TooltipProvider>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
                onClick={() => toast.info("Calendar booking coming in Phase 2.1")}
              >
                <Calendar className="size-3.5" /> <span className="ml-1.5">Book call</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Schedule a discovery call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
              >
                <a href={`mailto:${lead.sender_email}`}>
                  <MessageSquare className="size-3.5" /> <span className="ml-1.5">Send message</span>
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply via email — in-app composer coming soon</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
                onClick={() => toast.info("Proposals coming in Phase 2.1")}
              >
                <FileText className="size-3.5" /> <span className="ml-1.5">Create proposal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send packages and pricing</TooltipContent>
          </Tooltip>

          {isConverted ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-[10px] border-emerald-400/30 bg-emerald-500/10 text-[12.5px] font-semibold text-emerald-300 shadow-none transition-colors hover:bg-emerald-500/20 hover:text-emerald-200"
                  onClick={() => toast.info("Client records coming in Phase 2.2")}
                >
                  <ExternalLink className="size-3.5" /> <span className="ml-1.5">View client</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Already a client — open their record</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 rounded-[10px] border-reps-orange-border/40 bg-reps-orange-soft/15 text-[12.5px] font-semibold text-reps-orange shadow-none transition-colors hover:border-reps-orange-border/70 hover:bg-reps-orange-soft/30 hover:text-reps-orange"
                  onClick={() => convertMut.mutate()}
                  disabled={convertMut.isPending}
                >
                  <UserCheck className="size-3.5" /> <span className="ml-1.5">Convert to client</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as a paying client and move out of pipeline</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
