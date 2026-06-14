import * as React from "react";
import { MapPin, Calendar, MessageSquare, FileText, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { type LeadDTO, updateLead } from "@/lib/leads/leads.functions";
import { sourceLabel } from "./SourceChipsRow";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minutes ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hours ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} days ago`;
  return new Date(iso).toLocaleDateString();
}

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

export function SelectedLeadCard({ lead }: { lead: LeadDTO }) {
  const qc = useQueryClient();

  const convertMut = useMutation({
    mutationFn: () => updateLead({ data: { id: lead.id, stage: "converted" } }),
    onSuccess: () => {
      toast.success("Lead converted");
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });

  return (
    <div className="rounded-[18px] border border-reps-border bg-reps-panel p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-reps-orange-soft text-[12px] font-bold text-reps-orange">
          {initials(lead.sender_name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[17px] font-bold text-white">{lead.sender_name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge className="rounded-full border-reps-orange-border/40 bg-reps-orange-soft px-2 py-0.5 text-[10.5px] font-semibold text-reps-orange">
              {lead.stage === "new" ? "New lead" : "Active lead"}
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
          "{lead.message}"
        </p>
      </div>

      {/* Actions: 2x2 grid */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Button
          className="h-10 rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white shadow-none transition-colors hover:bg-reps-orange-dark"
          onClick={() => toast.info("Calendar booking coming in Phase 2.1")}
        >
          <Calendar className="size-3.5" /> <span className="ml-1.5">Book call</span>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
        >
          <a href={`mailto:${lead.sender_email}`}>
            <MessageSquare className="size-3.5" /> <span className="ml-1.5">Send message</span>
          </a>
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-[10px] border-reps-border bg-reps-panel text-[12.5px] font-semibold text-white/85 shadow-none transition-colors hover:bg-reps-panel-soft hover:text-white"
          onClick={() => toast.info("Proposals coming in Phase 2.1")}
        >
          <FileText className="size-3.5" /> <span className="ml-1.5">Create proposal</span>
        </Button>
        <Button
          variant="outline"
          className="h-10 rounded-[10px] border-reps-orange-border/40 bg-reps-orange-soft/15 text-[12.5px] font-semibold text-reps-orange shadow-none transition-colors hover:border-reps-orange-border/70 hover:bg-reps-orange-soft/30 hover:text-reps-orange"
          onClick={() => convertMut.mutate()}
          disabled={convertMut.isPending || lead.stage === "converted"}
        >
          <UserCheck className="size-3.5" /> <span className="ml-1.5">Convert to client</span>
        </Button>
      </div>
    </div>
  );
}
