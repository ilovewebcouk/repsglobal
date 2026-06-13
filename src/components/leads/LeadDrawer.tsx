import * as React from "react";
import { Sparkles, Loader2, Send, RefreshCw, MapPin, Mail, Phone, Target as TargetIcon, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProLock } from "./ProLock";
import {
  LEAD_STAGES,
  LEAD_STAGE_LABEL,
  type LeadDTO,
  type LeadStage,
  updateLead,
} from "@/lib/leads/leads.functions";
import { scoreLead, draftLeadReply, type DraftReply } from "@/lib/leads/leads-ai.functions";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

function bandClass(band: LeadDTO["ai_band"]) {
  if (band === "hot") return "border-reps-orange-border bg-reps-orange-soft text-reps-orange";
  if (band === "warm") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-300";
  return "border-reps-border bg-reps-panel-soft text-white/55";
}

export function LeadDrawer({ lead, locked }: { lead: LeadDTO; locked: boolean }) {
  const qc = useQueryClient();
  const [draft, setDraft] = React.useState<DraftReply | null>(null);

  const stageMutation = useMutation({
    mutationFn: (stage: LeadStage) => updateLead({ data: { id: lead.id, stage } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't update"),
  });

  const valueMutation = useMutation({
    mutationFn: (pence: number | null) =>
      updateLead({ data: { id: lead.id, estimated_value_pence: pence } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["lead-kpis"] });
    },
  });

  const scoreMutation = useMutation({
    mutationFn: () => scoreLead({ data: { enquiryId: lead.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("AI scored this lead");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't score lead"),
  });

  const draftMutation = useMutation({
    mutationFn: () => draftLeadReply({ data: { enquiryId: lead.id } }),
    onSuccess: (d) => setDraft(d),
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Couldn't draft reply"),
  });

  const valueGbp = lead.estimated_value_pence ? (lead.estimated_value_pence / 100).toFixed(0) : "";

  return (
    <div className="flex flex-col gap-4">
      {/* Identity */}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-bold text-white">{lead.sender_name}</h3>
            <p className="mt-0.5 text-[11.5px] text-white/45">Received {timeAgo(lead.created_at)} · {lead.source}</p>
          </div>
          {lead.ai_band ? (
            <Badge variant="outline" className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${bandClass(lead.ai_band)}`}>
              {lead.ai_band}
              {lead.ai_score !== null ? ` · ${lead.ai_score}` : ""}
            </Badge>
          ) : null}
        </div>
        <div className="mt-2 flex flex-col gap-1 text-[12.5px] text-white/70">
          <a href={`mailto:${lead.sender_email}`} className="inline-flex items-center gap-1.5 hover:text-white">
            <Mail className="size-3.5" /> {lead.sender_email}
          </a>
          {lead.sender_phone ? (
            <a href={`tel:${lead.sender_phone}`} className="inline-flex items-center gap-1.5 hover:text-white">
              <Phone className="size-3.5" /> {lead.sender_phone}
            </a>
          ) : null}
          {lead.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" /> {lead.location}
            </span>
          ) : null}
        </div>
      </div>

      {/* Stage + value */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">Stage</label>
          <Select value={lead.stage} onValueChange={(v) => stageMutation.mutate(v as LeadStage)}>
            <SelectTrigger className="mt-1 h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STAGES.map((s) => (
                <SelectItem key={s} value={s}>{LEAD_STAGE_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">Est. value (£)</label>
          <Input
            type="number"
            min={0}
            defaultValue={valueGbp}
            placeholder="0"
            className="mt-1 h-9 rounded-[10px] border-reps-border bg-reps-panel-soft text-[12.5px]"
            onBlur={(e) => {
              const v = e.target.value.trim();
              const pence = v ? Math.round(Number(v) * 100) : null;
              valueMutation.mutate(pence);
            }}
          />
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">Message</label>
        <p className="mt-1 whitespace-pre-wrap rounded-[14px] border border-reps-border/60 bg-reps-panel-soft px-3 py-2.5 text-[13px] leading-relaxed text-white/85">
          {lead.message}
        </p>
      </div>

      {/* Meta */}
      {(lead.goals.length > 0 || lead.frequency || lead.start_by || lead.budget) ? (
        <dl className="flex flex-col gap-2 rounded-[14px] border border-reps-border/60 bg-reps-panel-soft p-3 text-[12px]">
          {lead.goals.length > 0 ? (
            <div className="flex gap-2">
              <TargetIcon className="mt-0.5 size-3.5 shrink-0 text-white/55" />
              <span className="text-white/85">{lead.goals.join(", ")}</span>
            </div>
          ) : null}
          {lead.frequency ? <div><span className="text-white/45">Frequency: </span><span className="text-white/85">{lead.frequency}</span></div> : null}
          {lead.start_by ? <div><span className="text-white/45">Start by: </span><span className="text-white/85">{lead.start_by}</span></div> : null}
          {lead.budget ? <div><span className="text-white/45">Budget: </span><span className="text-white/85">{lead.budget}</span></div> : null}
        </dl>
      ) : null}

      {/* AI insight card */}
      <ProLock locked={locked} feature="AI insights">
        <div className="rounded-[16px] border border-reps-orange-border/40 bg-gradient-to-br from-reps-orange-soft/30 to-reps-panel p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-reps-orange">
              <Sparkles className="size-3.5" />
              AI Insight
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-[8px] border-reps-border bg-reps-panel-soft text-[11px]"
              onClick={() => scoreMutation.mutate()}
              disabled={scoreMutation.isPending}
            >
              {scoreMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              <span className="ml-1">{lead.ai_score === null ? "Score" : "Re-score"}</span>
            </Button>
          </div>

          {lead.ai_score === null && !scoreMutation.isPending ? (
            <p className="text-[12.5px] text-white/55">No AI score yet. Click Score to analyse this lead.</p>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="font-display text-[28px] font-bold leading-none text-white">{lead.ai_score ?? "—"}</div>
                <div className="flex-1">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">Intent score</div>
                  {lead.ai_predicted_pct !== null ? (
                    <div className="text-[11.5px] text-white/70">{lead.ai_predicted_pct}% predicted conversion</div>
                  ) : null}
                </div>
              </div>
              {lead.ai_summary ? (
                <p className="text-[12.5px] leading-relaxed text-white/80">{lead.ai_summary}</p>
              ) : null}
              {lead.ai_recommended_action ? (
                <div className="rounded-[10px] border border-reps-orange-border/30 bg-reps-orange-soft/20 px-3 py-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-reps-orange">Next best action</div>
                  <div className="mt-0.5 text-[12.5px] text-white/90">{lead.ai_recommended_action}</div>
                </div>
              ) : null}
            </div>
          )}

          <Button
            className="mt-3 h-9 w-full rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white hover:bg-reps-orange-dark"
            onClick={() => draftMutation.mutate()}
            disabled={draftMutation.isPending}
          >
            {draftMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            <span className="ml-1.5">Draft reply with AI</span>
          </Button>
        </div>
      </ProLock>

      {/* Draft reply preview */}
      {draft ? (
        <div className="rounded-[14px] border border-reps-border/60 bg-reps-panel-soft p-3">
          <div className="text-[10.5px] font-semibold uppercase tracking-wider text-white/45">AI draft</div>
          <Input
            defaultValue={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            className="mt-1 h-9 rounded-[10px] border-reps-border bg-reps-ink text-[12.5px]"
          />
          <Textarea
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            rows={8}
            className="mt-2 rounded-[10px] border-reps-border bg-reps-ink text-[12.5px]"
          />
          <Button
            asChild
            size="sm"
            className="mt-2 h-9 w-full rounded-[10px] bg-reps-orange text-[12.5px] font-semibold text-white hover:bg-reps-orange-dark"
          >
            <a
              href={`mailto:${lead.sender_email}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`}
            >
              <Send className="size-3.5" />
              <span className="ml-1.5">Open in email</span>
            </a>
          </Button>
        </div>
      ) : null}

      {/* Follow-up time hint */}
      {lead.follow_up_at ? (
        <div className="flex items-center gap-1.5 text-[11.5px] text-white/55">
          <Clock className="size-3" /> Follow-up {new Date(lead.follow_up_at).toLocaleString()}
        </div>
      ) : null}
    </div>
  );
}
